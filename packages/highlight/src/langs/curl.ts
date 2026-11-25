import type { Grammar, State, StateRule } from '../core/types'
import {
  SHELL_LINE_SPLICE,
  SHELL_SPLICES as SPLICES,
  SHELL_WORD_START as WORD_START,
  shellContinuation,
  shellEscape,
} from './shared/shell'

/** A curl command highlights its method and JSON payload alongside shell strings. */
const METHODS = 'get|post|put|patch|delete|head|options|trace|connect'
const DATA_OPTIONS = ['data', 'data-ascii', 'data-binary', 'data-raw', 'json']

// The curl option table defines which flags consume a value.
// https://github.com/curl/curl/blob/curl-8_16_0/src/tool_getparam.c
// The value can look like another flag, so those options take the whole shell word.
const SHORT_SWITCHES = '012346#:aBfGgIijkJlLMnNOpqRsSvVZ'
const SHORT_VALUE_OPTIONS = 'ACDEFHKPQTUXYbcehmortuwxyz'
const LONG_VALUE_OPTIONS = `
  abstract-unix-socket alt-svc aws-sigv4 cacert capath cert cert-type ciphers config connect-timeout
  connect-to continue-at cookie cookie-jar create-file-mode crlfile curves data-urlencode delegation
  dns-interface dns-ipv4-addr dns-ipv6-addr dns-servers doh-url dump-header ech egd-file engine
  etag-compare etag-save expect100-timeout form form-string ftp-account ftp-alternative-to-user
  ftp-method ftp-port ftp-ssl-ccc-mode happy-eyeballs-timeout-ms haproxy-clientip header help
  hostpubmd5 hostpubsha256 hsts interface ip-tos ipfs-gateway keepalive-cnt keepalive-time key
  key-type knownhosts krb krb4 libcurl limit-rate local-port login-options mail-auth mail-from
  mail-rcpt max-filesize max-redirs max-time netrc-file noproxy oauth2-bearer output output-dir
  parallel-max parallel-max-host pass pinnedpubkey preproxy proto proto-default proto-redir proxy
  proxy-cacert proxy-capath proxy-cert proxy-cert-type proxy-ciphers proxy-crlfile proxy-header
  proxy-key proxy-key-type proxy-pass proxy-pinnedpubkey proxy-service-name proxy-tls13-ciphers
  proxy-tlsauthtype proxy-tlspassword proxy-tlsuser proxy-user proxy1.0 pubkey quote random-file
  range rate referer request-target resolve retry retry-delay retry-max-time sasl-authzid
  service-name sigalgs socks4 socks4a socks5 socks5-gssapi-service socks5-hostname speed-limit
  speed-time ssl-sessions stderr telnet-option tftp-blksize time-cond tls-max tls13-ciphers
  tlsauthtype tlspassword tlsuser trace trace-ascii trace-config unix-socket upload-file
  upload-flags url url-query user user-agent variable vlan-priority write-out
`
  .trim()
  .split(/\s+/)

const SHELL_SEPARATOR = String.raw`[ \t\n;&|()]|[<>](?!${SPLICES}\()|\r\n`
const SHELL_WORD_END = String.raw`(?=${SPLICES}(?:${SHELL_SEPARATOR}|(?![\s\S])))`
const OPTION_START = `(?=-)${WORD_START}-`
const COMMENT_START = `(?=#)${WORD_START}`

/** Recognize an option's spelling without consuming its splices as plain text. */
const splicedName = (name: string): string => [...name].map((char) => (char === '.' ? '\\.' : char)).join(SPLICES)

const longOption = (names: readonly string[], prefix = ''): string => {
  const spelling = names.map(splicedName).join('|')
  return `${OPTION_START}(?=${SPLICES}-${SPLICES}${prefix}(?:${spelling})(?:${SPLICES}=|${SHELL_WORD_END}))`
}

const shortOption = (valueOption: string, switches = `[${SHORT_SWITCHES}]`): string =>
  `${OPTION_START}(?=(?:${SPLICES}${switches})*${SPLICES}${valueOption})`

const SHELL_APOSTROPHES = String.raw`'${SPLICES}(?:\\'|"${SPLICES}'${SPLICES}")${SPLICES}'`
// The closing quote must end the shell argument so adjacent segments do not
// count as separate JSON bodies.
const QUOTED_BODY = String.raw`[\[{](?:[^']|${SHELL_APOSTROPHES})*(?:'${SHELL_WORD_END}|(?![\s\S]))`

// The lookahead keeps an I/O descriptor with its redirection across splices.
const REDIRECTION_SYMBOL = String.raw`[<>](?!${SPLICES}\()`
const redirection: StateRule = {
  match: String.raw`(?=[\d<>&])(?:${WORD_START}(?=\d(?:${SPLICES}\d)*${SPLICES}${REDIRECTION_SYMBOL})|(?=${REDIRECTION_SYMBOL}|&${SPLICES}>))`,
  push: 'redirection-operator',
}
const redirectionTarget: StateRule = { match: '(?=[\\s\\S])', set: 'redirection-target' }
const substitution: StateRule = {
  match: String.raw`\$(?=${SPLICES}\()`,
  scope: 'variable',
  push: 'substitution-open',
}
const processSubstitution: StateRule = {
  match: String.raw`[<>](?=${SPLICES}\()`,
  scope: 'variable',
  push: 'substitution-open',
}
const argumentSpace: StateRule[] = [shellContinuation, { match: '[ \\t]+' }]
const stepIntoWord: StateRule[] = [
  { match: COMMENT_START, pop: true },
  { match: `(?!(?:${SHELL_SEPARATOR}))(?=[\\s\\S])`, set: 'argument-word' },
  { match: '(?=[\\s\\S])', pop: true },
]
const shortSwitch: StateRule = { match: `[${SHORT_SWITCHES}]+` }
const longName: StateRule = { match: '[\\w.-]+' }
const commandEnd: StateRule = { match: '(?=[\\n;&|()])', pop: true }

const shortOptionValue = (flag: string, target: string, switches = `[${SHORT_SWITCHES}]`): State => ({
  rules: [shellContinuation, { match: `(?:${switches})+` }, { match: flag, set: target }],
})

/** Consume wrapper operands before looking for the executable that follows. */
const wrapperWithValues = (name: string, short: string, long?: string): Record<string, State> => {
  const flag = `[${short}]`
  const switches = `(?!${flag})[A-Za-z0-9]`
  const grouped = `${name}-short-option`
  return {
    [`${name}-options`]: {
      rules: [
        { match: shortOption(flag, switches), push: grouped },
        ...(long ? [{ match: longOption(long.split('|')), push: 'long-value-option' }] : []),
        { include: 'wrapper-options' },
      ],
    },
    [grouped]: shortOptionValue(flag, 'argument', switches),
  }
}

const curl: Grammar = {
  name: 'curl',
  states: {
    root: {
      rules: [
        shellContinuation,
        redirection,
        { match: '[ \\t\\n]+|\\r\\n|[;&|()]' },
        { match: '#[^\\n]*', scope: 'comment' },
        { match: '\\$(?=[ \\t])' },
        // These reserved words leave the lexer at the start of a command.
        { match: `(?:if|then|elif|else|while|until|do|[!{])${SHELL_WORD_END}` },
        { match: `(?:command|nohup|time)${SHELL_WORD_END}`, push: 'wrapper-options' },
        { match: `env${SHELL_WORD_END}`, push: 'env-options' },
        { match: `exec${SHELL_WORD_END}`, push: 'exec-options' },
        { match: `sudo${SHELL_WORD_END}`, push: 'sudo-options' },
        { match: '[A-Za-z_]\\w*=', push: 'argument-word' },
        {
          match: String.raw`([\w./~+-]*/)?([cC])(?=${SPLICES}[uU]${SPLICES}[rR]${SPLICES}[lL](?:\.[eE][xX][eE])?${SHELL_WORD_END})`,
          scope: [null, 'keyword'],
          push: 'curl-name',
        },
        {
          match: String.raw`(?:'(?:[\w./~+-]*/)?[cC][uU][rR][lL](?:\.[eE][xX][eE])?'|"(?:[\w./~+-]*/)?[cC][uU][rR][lL](?:\.[eE][xX][eE])?")${SHELL_WORD_END}`,
          scope: 'string',
          push: 'curl-command',
        },
        // A curl block can show just an option fragment.
        { match: String.raw`(?<=(?<![\s\S])(?:[ \t]|${SHELL_LINE_SPLICE})*)(?=-)`, push: 'curl-command' },
        { match: '(?=[\\s\\S])', push: 'other-command' },
      ],
    },
    'curl-name': {
      rules: [
        shellContinuation,
        { match: '[uUrR]+', scope: 'keyword' },
        { match: String.raw`([lL])(?:\.[eE][xX][eE])?`, scope: ['keyword'], set: 'curl-command' },
      ],
    },
    'wrapper-options': {
      rules: [
        ...argumentSpace,
        redirection,
        { match: `--${SHELL_WORD_END}`, pop: true },
        { match: '-(?=[^ \\t\\r\\n])', push: 'argument-word' },
        { match: '(?=[\\s\\S])', pop: true },
      ],
    },
    ...wrapperWithValues('env', 'CuS', 'chdir|split-string|unset'),
    ...wrapperWithValues('exec', 'a'),
    ...wrapperWithValues(
      'sudo',
      'CDghpRrTtuU',
      'chdir|chroot|close-from|command-timeout|group|host|other-user|prompt|role|type|user',
    ),
    'curl-command': {
      rules: [
        shellContinuation,
        redirection,
        commandEnd,
        // Splices can appear even between the dashes in the end-of-options marker.
        { match: `${OPTION_START}(?=${SPLICES}-${SHELL_WORD_END})`, push: 'end-of-options' },
        { match: shortOption('d'), push: 'short-data-option' },
        { match: shortOption('X'), push: 'short-method-option' },
        { match: shortOption(`[${SHORT_VALUE_OPTIONS}]`), push: 'short-value-option' },
        { match: longOption(DATA_OPTIONS), push: 'long-data-option' },
        { match: longOption(['request']), push: 'long-method-option' },
        {
          match: longOption(
            [...LONG_VALUE_OPTIONS, ...DATA_OPTIONS, 'request'],
            `(?:${splicedName('expand-')}${SPLICES})?`,
          ),
          push: 'long-value-option',
        },

        // Keep dots and numbers in switch names out of the number scope.
        { match: `${OPTION_START}(?=${SPLICES}-${SPLICES}[A-Za-z])`, push: 'long-switches' },
        { match: shortOption(`[${SHORT_SWITCHES}]${SHELL_WORD_END}`), push: 'short-switches' },
        { match: `${OPTION_START}[A-Za-z]` },
        { include: 'command-content' },
      ],
    },
    'other-command': {
      rules: [shellContinuation, redirection, commandEnd, { include: 'command-content' }],
    },
    'command-content': {
      rules: [
        { match: String.raw`${COMMENT_START}#[^\n]*`, scope: 'comment' },
        { match: '\\b[cC][uU][rR][lL]\\b', scope: 'keyword' },
        { include: 'word-content' },
      ],
    },
    'end-of-options': {
      rules: [shellContinuation, { match: '-', set: 'positional' }],
    },
    positional: {
      rules: [
        shellContinuation,
        redirection,
        // Leave both the positional state and the curl command at a separator.
        { ...commandEnd, pop: 2 },
        { include: 'command-content' },
      ],
    },

    'short-data-option': shortOptionValue('d', 'data'),
    'short-method-option': shortOptionValue('X', 'method'),
    'short-value-option': shortOptionValue(`[${SHORT_VALUE_OPTIONS}]`, 'argument'),
    'short-switches': {
      rules: [shellContinuation, shortSwitch, { match: '(?=[\\s\\S])', pop: true }],
    },
    'long-data-option': {
      rules: [
        shellContinuation,
        longName,
        { match: '=', set: 'data-attached' },
        { match: '(?=[\\s\\S])', set: 'data' },
      ],
    },
    'long-method-option': {
      rules: [
        shellContinuation,
        longName,
        { match: '=', set: 'method-attached' },
        { match: '(?=[\\s\\S])', set: 'method' },
      ],
    },
    'long-value-option': {
      rules: [
        shellContinuation,
        longName,
        { match: '=', set: 'argument-word' },
        { match: '(?=[\\s\\S])', set: 'argument' },
      ],
    },
    'long-switches': {
      rules: [shellContinuation, longName, { match: '(?=[\\s\\S])', pop: true }],
    },

    argument: {
      rules: [...argumentSpace, redirection, ...stepIntoWord],
    },
    'redirection-operator': {
      rules: [
        shellContinuation,
        { match: '\\d+', scope: 'number' },
        { match: '<', set: 'input-redirection' },
        { match: '>', set: 'output-redirection' },
        { match: '&', set: 'combined-redirection' },
      ],
    },
    'input-redirection': {
      rules: [
        shellContinuation,
        { match: '<', set: 'heredoc-redirection' },
        { match: '[>&]', set: 'redirection-target' },
        redirectionTarget,
      ],
    },
    'heredoc-redirection': {
      rules: [shellContinuation, { match: '[-<]', set: 'redirection-target' }, redirectionTarget],
    },
    'output-redirection': {
      rules: [shellContinuation, { match: '[>&|]', set: 'redirection-target' }, redirectionTarget],
    },
    'combined-redirection': {
      rules: [shellContinuation, { match: '>', set: 'output-redirection' }],
    },
    'redirection-target': {
      rules: [...argumentSpace, ...stepIntoWord],
    },
    'argument-word': {
      rules: [shellContinuation, { match: SHELL_WORD_END, pop: true }, { include: 'word-content' }],
    },
    method: {
      ignoreCase: true,
      rules: [...argumentSpace, redirection, { include: 'method-attached' }],
    },
    'method-attached': {
      ignoreCase: true,
      rules: [
        shellContinuation,
        { match: `(?:${METHODS})${SHELL_WORD_END}`, scope: 'symbol', pop: true },
        ...stepIntoWord,
      ],
    },
    data: {
      rules: [...argumentSpace, redirection, { include: 'data-attached' }],
    },
    'data-attached': {
      rules: [
        shellContinuation,
        { match: String.raw`'(?=\s*${QUOTED_BODY})`, scope: 'string', set: 'json-quoted' },
        ...stepIntoWord,
      ],
    },
    'json-quoted': {
      rules: [
        { match: "'", scope: 'string', pop: true },
        { match: '(?=[\\s\\S])', push: 'json-body' },
      ],
    },
    'json-body': {
      default: 'string',
      // Mask escaped apostrophes so the embedded grammar can scope the whole
      // JSON key or string. Validate the text the shell passes to curl.
      embed: {
        language: 'json',
        until: "'",
        holes: SHELL_APOSTROPHES,
        preserveHoleScope: true,
        holePunctuation: String.raw`\\(?=\r?\n)`,
        validate: { format: 'json', holeReplacement: "'" },
      },
      rules: [],
    },

    'word-content': {
      rules: [
        shellEscape,
        substitution,
        processSubstitution,
        { match: '`', scope: 'variable', push: 'backtick' },
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },
        { match: '\\b\\d+(?:\\.\\d+)?\\b', scope: 'number' },
      ],
    },
    'string-double': {
      default: 'string',
      rules: [
        shellContinuation,
        { match: '\\\\.', scope: 'string.escape' },
        substitution,
        { match: '`', scope: 'variable', push: 'backtick' },
        { match: '"', scope: 'string', pop: true },
      ],
    },
    'substitution-open': {
      default: 'variable',
      rules: [shellContinuation, { match: '\\(', set: 'subshell' }],
    },
    subshell: {
      default: 'variable',
      rules: [
        shellContinuation,
        { ...shellEscape, scope: 'variable' },
        substitution,
        { match: '\\(', push: 'subshell' },
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },
        { match: '\\)', scope: 'variable', pop: true },
      ],
    },
    backtick: {
      default: 'variable',
      rules: [shellContinuation, { ...shellEscape, scope: 'variable' }, { match: '`', pop: true }],
    },
    'string-single': {
      default: 'string',
      rules: [{ match: "'", scope: 'string', pop: true }],
    },
  },
}

export default curl
