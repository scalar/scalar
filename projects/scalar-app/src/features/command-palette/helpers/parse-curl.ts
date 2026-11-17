import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { encode } from 'js-base64'
import { parse as parseShellCommand } from 'shell-quote'

import { isWindowsCommand, parseWindowsCommand } from './parse-windows-command'

/** Every flag that sends its next argument as request data, --json is handled apart because it also sets headers. */
const DATA_FLAGS = new Set(['--data', '-d', '--data-raw', '--data-urlencode', '--data-binary', '--data-ascii'])

/** Every flag that sends a multipart form field, --form-string is the same without any special reading of its content. */
const FORM_FLAGS = new Set(['--form', '-F', '--form-string'])

/** Curl short flags that take a value, so the rest of a bundle like -XPOST or -sdfoo is that value rather than more flags. */
const SHORT_FLAGS_WITH_VALUE = new Set('AbcCdDeEFHKmoPQrtTuUwxXyYz')

/** One argument of a data flag, flagged when it came from --json because curl joins those without an ampersand. */
type DataPiece = { value: string; isJson: boolean }

/** The headers --json sets unless the command already sets them. */
const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' }

/** The header a multipart form sets unless the command already sets it, curl adds the boundary when it sends the request. */
const FORM_HEADERS = { 'Content-Type': 'multipart/form-data' }

/** The characters a backslash escapes inside a quoted form content. */
const FORM_CONTENT_ESCAPES = new Set(['"', '\\'])

/** Value-taking options must consume their argument even when the importer does not use it. See https://curl.se/docs/manpage.html. */
const LONG_FLAGS_WITH_VALUE = new Set([
  ...DATA_FLAGS,
  ...FORM_FLAGS,
  '--json',
  '--request',
  '--url',
  '--header',
  '--user',
  '--cookie',
  '--abstract-unix-socket',
  '--alt-svc',
  '--aws-sigv4',
  '--cacert',
  '--capath',
  '--cert',
  '--cert-type',
  '--ciphers',
  '--config',
  '--connect-timeout',
  '--connect-to',
  '--continue-at',
  '--cookie-jar',
  '--create-file-mode',
  '--crlfile',
  '--curves',
  '--delegation',
  '--dns-interface',
  '--dns-ipv4-addr',
  '--dns-ipv6-addr',
  '--dns-servers',
  '--doh-url',
  '--dump-header',
  '--ech',
  '--egd-file',
  '--engine',
  '--etag-compare',
  '--etag-save',
  '--expect100-timeout',
  '--ftp-account',
  '--ftp-alternative-to-user',
  '--ftp-method',
  '--ftp-port',
  '--ftp-ssl-ccc-mode',
  '--happy-eyeballs-timeout-ms',
  '--haproxy-clientip',
  '--hostpubmd5',
  '--hostpubsha256',
  '--hsts',
  '--httpsig-algo',
  '--httpsig-headers',
  '--httpsig-key',
  '--httpsig-keyid',
  '--interface',
  '--ip-tos',
  '--ipfs-gateway',
  '--keepalive-cnt',
  '--keepalive-time',
  '--key',
  '--key-type',
  '--knownhosts',
  '--krb',
  '--libcurl',
  '--limit-rate',
  '--local-port',
  '--login-options',
  '--mail-auth',
  '--mail-from',
  '--mail-rcpt',
  '--max-filesize',
  '--max-redirs',
  '--max-time',
  '--netrc-file',
  '--noproxy',
  '--oauth2-bearer',
  '--output',
  '--output-dir',
  '--parallel-max',
  '--parallel-max-host',
  '--pass',
  '--pinnedpubkey',
  '--preproxy',
  '--proto',
  '--proto-default',
  '--proto-redir',
  '--proxy',
  '--proxy-cacert',
  '--proxy-capath',
  '--proxy-cert',
  '--proxy-cert-type',
  '--proxy-ciphers',
  '--proxy-crlfile',
  '--proxy-header',
  '--proxy-key',
  '--proxy-key-type',
  '--proxy-pass',
  '--proxy-pinnedpubkey',
  '--proxy-service-name',
  '--proxy-tls13-ciphers',
  '--proxy-tlsauthtype',
  '--proxy-tlspassword',
  '--proxy-tlsuser',
  '--proxy-user',
  '--proxy1.0',
  '--pubkey',
  '--quote',
  '--random-file',
  '--range',
  '--rate',
  '--referer',
  '--request-target',
  '--resolve',
  '--retry',
  '--retry-delay',
  '--retry-max-time',
  '--sasl-authzid',
  '--service-name',
  '--sigalgs',
  '--socks4',
  '--socks4a',
  '--socks5',
  '--socks5-gssapi-service',
  '--socks5-hostname',
  '--speed-limit',
  '--speed-time',
  '--ssl-sessions',
  '--stderr',
  '--telnet-option',
  '--tftp-blksize',
  '--time-cond',
  '--tls-max',
  '--tls13-ciphers',
  '--tlsauthtype',
  '--tlspassword',
  '--tlsuser',
  '--trace',
  '--trace-ascii',
  '--trace-config',
  '--unix-socket',
  '--upload-file',
  '--upload-flags',
  '--url-query',
  '--user-agent',
  '--variable',
  '--vlan-priority',
  '--write-out',
])

/** The request details collected while reading a cURL command. */
type CurlCommandResult = {
  url: string
  method?: HttpMethod
  headers?: Record<string, string>
  body?: string
  queryParameters?: Array<{ key: string; value: string }>
  servers?: string[]
}

/** Short flags can be bundled (-sG) and carry their value attached (-XPOST), unlike long flags. */
const isShortFlagBundle = (arg: string): boolean => arg.startsWith('-') && !arg.startsWith('--') && arg.length > 2

/** Split known options so their values follow the same consumption rules in both forms. */
const isLongFlagWithAttachedValue = (arg: string): boolean =>
  arg.startsWith('--') && arg.includes('=') && LONG_FLAGS_WITH_VALUE.has(arg.slice(0, arg.indexOf('=')))

/** Split --flag=value into the flag and its value, the value can hold more equal signs. */
function splitLongFlag(arg: string): string[] {
  const separatorIndex = arg.indexOf('=')
  return [arg.slice(0, separatorIndex), arg.slice(separatorIndex + 1)]
}

/** Split a short flag bundle into the flags curl sees, stopping at the first flag that takes a value. */
function splitShortFlags(bundle: string): string[] {
  const [, ...flags] = [...bundle]
  const tokens: string[] = []

  for (const [index, flag] of flags.entries()) {
    tokens.push(`-${flag}`)

    if (SHORT_FLAGS_WITH_VALUE.has(flag)) {
      const attachedValue = flags.slice(index + 1).join('')
      if (attachedValue) {
        tokens.push(attachedValue)
      }
      break
    }
  }

  return tokens
}

/** Empty arguments are not flags, so skip them wherever a flag or the value of a flag other than data is expected. */
function nextArgument<T>(queue: T[]): T | undefined {
  let next = queue.shift()
  while (next === '') {
    next = queue.shift()
  }
  return next
}

/** Parse and normalize a curl command */
export function parseCurlCommand(curlCommand: string) {
  const entries = isWindowsCommand(curlCommand) ? parseWindowsCommand(curlCommand) : parseShellCommand(curlCommand)
  const args = entries.map((arg) => {
    if (typeof arg === 'object' && 'op' in arg && arg.op === 'glob') {
      return arg.pattern.trim()
    }
    return typeof arg === 'string' ? arg.trim() : arg
  })

  const result: CurlCommandResult = { url: '' }

  const data: DataPiece[] = []
  const form: string[] = []
  let isGet = false

  const queue = [...args]
  const iterator = { next: () => ({ value: nextArgument(queue) }) }
  let arg = iterator.next().value

  while (arg !== undefined) {
    if (typeof arg === 'string' && isShortFlagBundle(arg)) {
      // Expand bundled and attached short flags e.g -sG or -XPOST
      queue.unshift(...splitShortFlags(arg))
    } else if (typeof arg === 'string' && isLongFlagWithAttachedValue(arg)) {
      // Expand attached long flag values e.g --request=PUT
      queue.unshift(...splitLongFlag(arg))
    } else if (arg === '-X' || arg === '--request') {
      // Extract method e.g curl -X POST
      parseMethod(iterator as Iterator<string>, result)
    } else if (arg === '--url') {
      // Extract URL e.g curl https://example.com
      parseUrl(iterator as Iterator<string>, result)
    } else if (arg === '-H' || arg === '--header') {
      // Extract headers e.g -H 'Content-Type: application/json'
      parseHeader(iterator as Iterator<string>, result)
    } else if (typeof arg === 'string' && DATA_FLAGS.has(arg)) {
      parseData(queue, data, arg)
    } else if (typeof arg === 'string' && FORM_FLAGS.has(arg)) {
      parseForm(queue, form, arg)
    } else if (arg === '--json') {
      // Send the data as JSON e.g curl --json '{"a":1}'
      parseData(queue, data, arg)
    } else if (arg === '-G' || arg === '--get') {
      // Send the data in the query string instead of the body e.g curl -G -d 'a=b'
      isGet = true
    } else if (typeof arg === 'string' && !result.url && (arg.startsWith('http') || arg.startsWith('www.'))) {
      // Extract URL e.g curl https://example.com
      parseUrl([arg][Symbol.iterator]() as Iterator<string>, result)
    } else if (arg === '-P') {
      // Extract path variables e.g -P 'foo=bar'
      parsePathVariables(iterator as Iterator<string>, result)
    } else if (typeof arg === 'string' && arg.toLowerCase().includes('content-type')) {
      // Extract Content-Type header e.g -H 'Content-Type: application/json'
      parseContentType(arg, result)
    } else if (arg === '-u' || arg === '--user') {
      // Extract Authorization header e.g -u 'username:password'
      parseAuth(iterator as Iterator<string>, result)
    } else if (arg === '-b' || arg === '--cookie') {
      // Extract Cookie header e.g -b 'foo=bar'
      parseCookie(iterator as Iterator<string>, result)
    } else if (
      typeof arg === 'string' &&
      (LONG_FLAGS_WITH_VALUE.has(arg) ||
        (arg.length === 2 && arg.startsWith('-') && SHORT_FLAGS_WITH_VALUE.has(arg.charAt(1))))
    ) {
      // An ignored option still owns its next argument, even if it looks like a flag or is empty.
      queue.shift()
    }
    arg = iterator.next().value
  }

  if (data.length) {
    applyData(result, data, isGet)
  }

  if (form.length) {
    applyForm(result, form)
  }

  return result
}

/** Get the method from a curl command */
function parseMethod(iterator: Iterator<string>, result: any) {
  result.method = iterator.next().value.toLowerCase()
}

/** Get the URL from a curl command */
function parseUrl(iterator: Iterator<string>, result: any) {
  const url = new URL(iterator.next().value.replace(/['"]/g, ''))
  result.servers = [url.origin]
  result.path = url.pathname !== '/' ? url.pathname : ''
  result.url = result.servers[0] + result.path

  // Merge existing query parameters with those from the URL
  const urlQueryParameters = parseQueryParameters(url.search)
  result.queryParameters = result.queryParameters
    ? [...result.queryParameters, ...urlQueryParameters]
    : urlQueryParameters
}

/** Get the headers from a curl command */
function parseHeader(iterator: Iterator<string>, result: any) {
  const header = iterator.next().value.split(/:(.*)/)
  result.headers = result.headers || {}
  if (header[1] !== undefined) {
    result.headers[header[0].trim()] = header[1].trim()
  } else {
    result.headers[header[0].trim()] = ''
  }
}

/** Get the {query} parameters from a curl command */
function parsePathVariables(iterator: Iterator<string>, result: any) {
  const param = iterator.next().value.replace(/['"]/g, '').split('=')
  result.pathVariables = result.pathVariables || {}
  if (param[1] !== undefined) {
    result.pathVariables[param[0].trim()] = param[1].trim()
  } else {
    result.pathVariables[param[0].trim()] = ''
  }
}

/** Get the ?query=parameters from a curl command */
function parseQueryParameters(url: string) {
  const queryParameters: Array<{ key: string; value: string }> = []
  // Base URL is required for relative URLs
  const urlObj = new URL(url, 'http://example.com')

  urlObj.searchParams.forEach((value, key) => {
    queryParameters.push({ key, value })
  })

  return queryParameters
}

/** Get the Content-Type header from a curl command */
function parseContentType(arg: string, result: any) {
  const header = arg.replace(/['"]/g, '').split(/:(.+)/)
  result.headers = result.headers || {}

  if (!header[0]) {
    return
  }

  if (header[1] !== undefined) {
    result.headers[header[0].trim()] = header[1].trim()
  } else {
    result.headers[header[0].trim()] = ''
  }
}

/** Get the Authorization header from a curl command */
function parseAuth(iterator: Iterator<string>, result: any) {
  const auth = iterator.next().value

  try {
    const encodedAuth = encode(auth)

    result.headers = result.headers || {}

    result.headers['Authorization'] = `Basic ${encodedAuth}`
  } catch (error) {
    console.warn('Could not base64 encode these HTTP basic auth credentials:', auth, error)
  }
}

/** Get the Cookie header from a curl command */
function parseCookie(iterator: Iterator<string>, result: any) {
  const cookie = iterator.next().value
  result.headers = result.headers || {}
  if (result.headers['Cookie']) {
    result.headers['Cookie'] += `; ${cookie}`
  } else {
    result.headers['Cookie'] = cookie.replace(/;$/, '') // Remove trailing semicolon if present
  }
}

/** Curl percent-encodes the content of --data-urlencode, so an & or = inside a value stays part of it, and a name before = or @ is kept as it is. */
function encodeUrlencodedData(argument: string): string {
  const separator = argument.includes('=') ? '=' : '@'
  const separatorIndex = argument.indexOf(separator)

  if (separatorIndex === -1) {
    return encodeURIComponent(argument)
  }

  const name = argument.slice(0, separatorIndex)
  // Mock reading the content from a file
  const content = separator === '@' ? '' : encodeURIComponent(argument.slice(separatorIndex + 1))

  return name ? `${name}=${content}` : content
}

/** Mock reading data from a file, --data-raw is the only flag that sends an @ as it is. */
function readDataValue(argument: string, flag: string): string {
  if (flag === '--data-urlencode') {
    return encodeUrlencodedData(argument)
  }

  return argument.startsWith('@') && flag !== '--data-raw' ? '' : argument
}

/** Collect the data of a curl data flag, an empty value is still data and the value of a flag is never another flag. */
function parseData(queue: unknown[], data: DataPiece[], flag: string): void {
  const nextArg = queue.shift()
  if (typeof nextArg === 'string') {
    data.push({ value: readDataValue(nextArg, flag), isJson: flag === '--json' })
  }
}

/** Curl reads the content of a quoted form field up to the closing quote, where a backslash escapes a quote or a backslash, so a semicolon inside stays part of it. */
function readQuotedFormContent(content: string): string {
  let value = ''

  for (let index = 1; index < content.length && content.charAt(index) !== '"'; index++) {
    if (content.charAt(index) === '\\' && FORM_CONTENT_ESCAPES.has(content.charAt(index + 1))) {
      index++
    }
    value += content.charAt(index)
  }

  return value
}

/** Mock reading a form file like data, the content of a field ends at the first semicolon that starts an option such as ;type=, and --form-string takes the content as it is. */
function readFormContent(content: string, flag: string): string {
  if (flag === '--form-string') {
    return content
  }

  if (content.startsWith('@') || content.startsWith('<')) {
    return ''
  }

  return content.startsWith('"') ? readQuotedFormContent(content) : (content.split(';')[0] ?? '')
}

/** Percent-encode a name=content form field so the body stays one field per ampersand, a field without an equal sign is not a field. */
function encodeFormField(argument: string, flag: string): string {
  const separatorIndex = argument.indexOf('=')

  if (separatorIndex === -1) {
    return ''
  }

  const name = encodeURIComponent(argument.slice(0, separatorIndex))
  const content = encodeURIComponent(readFormContent(argument.slice(separatorIndex + 1), flag))

  return `${name}=${content}`
}

/** Collect the field of a curl form flag, the value of a flag is never another flag. */
function parseForm(queue: unknown[], form: string[], flag: string): void {
  const nextArg = queue.shift()
  if (typeof nextArg === 'string') {
    form.push(encodeFormField(nextArg, flag))
  }
}

/** Curl joins repeated data flags with an ampersand and repeated --json flags without one. */
function joinData(data: DataPiece[]): string {
  return data.reduce(
    (joined, { value, isJson }): string => (joined ? `${joined}${isJson ? '' : '&'}${value}` : value),
    '',
  )
}

/** Curl appends the data to the URL with -G, otherwise sends it as the body and defaults the method to POST */
function applyData(result: CurlCommandResult, data: DataPiece[], isGet: boolean): void {
  if (data.some(({ isJson }): boolean => isJson)) {
    applyDefaultHeaders(result, JSON_HEADERS)
  }

  const joinedData = joinData(data)

  if (isGet) {
    const dataQueryParameters = parseQueryParameters(`?${joinedData}`)
    result.queryParameters = result.queryParameters
      ? [...result.queryParameters, ...dataQueryParameters]
      : dataQueryParameters
    return
  }

  result.body = joinedData
  result.method ??= 'post'
}

/** Curl sends a multipart form as a POST with or without -G, which only moves data, and an explicit method or Content-Type of the command wins. */
function applyForm(result: CurlCommandResult, form: string[]): void {
  applyDefaultHeaders(result, FORM_HEADERS)
  result.body = form.filter(Boolean).join('&')
  result.method ??= 'post'
}

/** Curl only adds these headers when the command does not set them, whatever their case. */
function applyDefaultHeaders(result: CurlCommandResult, defaults: Record<string, string>): void {
  result.headers = result.headers || {}
  const existingNames = new Set(Object.keys(result.headers).map((name): string => name.toLowerCase()))

  for (const [name, value] of Object.entries(defaults)) {
    if (!existingNames.has(name.toLowerCase())) {
      result.headers[name] = value
    }
  }
}
