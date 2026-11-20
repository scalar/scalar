import type { Grammar } from '../core/types'

/**
 * cURL command lines.
 *
 * A curl invocation is a shell command, but reading one is nothing like
 * reading a shell script: what matters is the request method and which flag
 * carries which value, not control flow. `@scalar/code-highlight` shipped a
 * bespoke curl grammar for that reason and `code.css` styles
 * `.hljs.language-curl` to match it, so this mirrors that scoping rather than
 * deferring to bash — which leaves `curl` and the method word unscoped.
 *
 * Flags are matched but left unscoped. They read as plain text, and any class
 * they carried would be shared with values that should be coloured: `-d` and
 * the JSON `true` in its body would both be `hljs-literal`.
 */

/** The methods `--request` and `-X` accept. Matched case-insensitively. */
const METHODS = 'get|post|put|patch|delete|head|options|trace|connect'

/** The long flags whose value can be a JSON request body. */
const LONG_DATA_FLAGS = '--data(?:-raw|-binary|-ascii)?|--json'

/** The shell can insert a literal apostrophe by closing and reopening the quote. */
const SHELL_APOSTROPHES = String.raw`'\\''|'"'"'`
const SHELL_CONTINUATION = String.raw`\\\r?\n`
// A line splice can still join another segment to the current shell argument.
const SHELL_WORD_END = String.raw`(?=(?:${SHELL_CONTINUATION})*(?:[ \t\n;&|<>()]|\r\n|(?![\s\S])))`

const SINGLE_QUOTED_CHARACTER = `(?:[^']|${SHELL_APOSTROPHES})`
const JSON_STRING = String.raw`"(?:[^'"\\]|\\[^']|${SHELL_APOSTROPHES})*"`
const JSON_NUMBER = String.raw`-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?`
// A delimiter keeps the regex from splitting bare text or digits into separate values.
const JSON_ATOM = String.raw`(?:true|false|null|${JSON_NUMBER})(?=[\s,\]}])`
const JSON_BODY_TOKEN = String.raw`(?:[\s{}\[\],:]|${JSON_STRING}|${JSON_ATOM})`
const QUOTED_JSON = String.raw`(?:\{${JSON_BODY_TOKEN}*\}|\[${JSON_BODY_TOKEN}*\])\s*'${SHELL_WORD_END}`
const UNTERMINATED_JSON = String.raw`[\[{]${SINGLE_QUOTED_CHARACTER}*(?![\s\S])`

/**
 * A backslash that ends the line continues the command on the next one. It is
 * layout, not part of any value, so it reads as punctuation.
 */
const LINE_CONTINUATION = { match: '\\\\$', scope: 'punctuation' }

const curl: Grammar = {
  name: 'curl',
  states: {
    root: {
      // Flags are case-sensitive: `-d` sends a body and `-D` names a file to
      // dump headers into, `-F` sends a form and `-f` fails on HTTP errors.
      rules: [
        LINE_CONTINUATION,

        // curl itself does not care about the case of a method, and neither did
        // the grammar this replaces, so the command and the method are matched
        // in any case.
        { match: '\\b[cC][uU][rR][lL]\\b', scope: 'keyword' },
        { match: '(^|\\s)(--request|-X)(?=\\s)', push: 'method' },

        { match: '(^|\\s)-d(?![\\w-])', push: 'data' },
        {
          // curl allows = before an attached value on long options only.
          match: String.raw`(^|\s)(?:${LONG_DATA_FLAGS})(?:=(?=(?:${SHELL_CONTINUATION})*')|${SHELL_WORD_END})`,
          push: 'data',
        },

        // Anchored to a boundary so the hyphens inside a URL or a header name
        // are not mistaken for flags, and consumed whole so a digit inside one
        // (`--http2`) is not read as a number.
        { match: '(^|\\s)--[A-Za-z][\\w-]*' },
        { match: '(^|\\s)-[A-Za-z](?![\\w-])' },

        // An escaped character outside quotes is literal. It has to come before
        // the quote rules: `'it'\''s'` is how a single quote is written inside
        // a single-quoted value (close, escaped quote, reopen), and reading that
        // `\'` as the start of a string inverts the rest of the line.
        { match: '\\\\[^\\r\\n]', scope: 'string.escape' },
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },

        { match: '\\b\\d+(?:\\.\\d+)?\\b', scope: 'number' },
      ],
    },

    method: {
      ignoreCase: true,
      rules: [
        // The method is the most useful token on the line, so it carries its
        // own scope instead of blending into the flag that introduces it.
        { match: `(\\s+)(${METHODS})\\b`, scope: [null, 'symbol'], pop: true },
        { match: '(?=[\\s\\S])', pop: true },
      ],
    },

    // Look for JSON tokens through the end of the shell argument so form
    // fields and bracketed text keep their string scope. An unfinished shell
    // quote can still highlight while the body is being typed.
    data: {
      rules: [
        LINE_CONTINUATION,
        { match: '\\s+' },
        {
          match: String.raw`'(?=\s*(?:${QUOTED_JSON}|${UNTERMINATED_JSON}))`,
          scope: 'string',
          set: 'json-quoted',
        },
        { match: '(?=[\\s\\S])', pop: true },
      ],
    },
    'json-quoted': {
      rules: [
        { match: "'", scope: 'string', pop: true },
        { match: '(?=[\\s\\S])', push: 'json-body' },
      ],
    },
    'json-body': {
      // Without the JSON grammar registered, the body is one string, as before.
      default: 'string',
      // `'\''` and `'"'"'` are the shell writing an apostrophe, not the end of
      // the body. Mask them so JSON can apply one scope to the whole key or
      // string. snippetz writes the first form and shell examples use both.
      embed: { language: 'json', until: "'", holes: SHELL_APOSTROPHES, preserveHoleScope: true },
      rules: [],
    },

    'string-double': {
      default: 'string',
      rules: [
        { match: '\\\\.', scope: 'string.escape' },
        // `$(...)` runs a command, so it reads as a value rather than text.
        { match: '\\$\\(', scope: 'variable', push: 'subshell' },
        { match: '"', scope: 'string', pop: true },
      ],
    },
    subshell: {
      default: 'variable',
      rules: [{ match: '\\)', scope: 'variable', pop: true }],
    },

    // Single quotes are literal in the shell, so nothing expands inside them.
    'string-single': {
      default: 'string',
      rules: [{ match: "'", scope: 'string', pop: true }],
    },
  },
}

export default curl
