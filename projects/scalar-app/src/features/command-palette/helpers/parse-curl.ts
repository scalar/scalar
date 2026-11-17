import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { encode } from 'js-base64'
import { parse as parseShellCommand } from 'shell-quote'

/** Every flag that sends its next argument as request data. */
const DATA_FLAGS = new Set(['--data', '-d', '--data-raw', '--data-urlencode', '--data-binary', '--data-ascii'])

/** Parse and normalize a curl command */
export function parseCurlCommand(curlCommand: string) {
  const args = parseShellCommand(curlCommand)
    .map((arg) => {
      if (typeof arg === 'object' && 'op' in arg && arg.op === 'glob') {
        return arg.pattern.trim()
      }
      return typeof arg === 'string' ? arg.trim() : arg
    })
    .filter((arg) => arg !== '')

  const result: {
    url: string
    method?: HttpMethod
    headers?: Record<string, string>
    body?: string
    queryParameters?: Array<{ key: string; value: string }>
    servers?: string[]
  } = { url: '' }

  const data: string[] = []
  let isGet = false

  const iterator = args[Symbol.iterator]()
  let arg = iterator.next().value

  while (arg) {
    if (arg === '-X' || arg === '--request') {
      // Extract method e.g curl -X POST
      parseMethod(iterator as Iterator<string>, result)
    } else if (arg === '--url') {
      // Extract URL e.g curl https://example.com
      parseUrl(iterator as Iterator<string>, result)
    } else if (arg === '-H' || arg === '--header') {
      // Extract headers e.g -H 'Content-Type: application/json'
      parseHeader(iterator as Iterator<string>, result)
    } else if (typeof arg === 'string' && DATA_FLAGS.has(arg)) {
      parseData(iterator as Iterator<string>, data)
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
    }
    arg = iterator.next().value
  }

  if (data.length) {
    applyData(result, data, isGet)
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

/** Collect the data of a curl data flag, curl sends the repeated flags joined with an ampersand */
function parseData(iterator: Iterator<string>, data: string[]) {
  const nextArg = iterator.next().value
  if (typeof nextArg === 'string') {
    // Mock reading data from file
    data.push(nextArg.startsWith('@') ? '' : nextArg)
  }
}

/** Curl appends the data to the URL with -G, otherwise sends it as the body and defaults the method to POST */
function applyData(result: any, data: string[], isGet: boolean) {
  const joinedData = data.filter(Boolean).join('&')

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
