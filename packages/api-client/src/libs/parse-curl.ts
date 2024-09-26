import { parse as shellParse } from 'shell-quote'

/** Parse and normalize a curl command */
export function parseCurlCommand(curlCommand: string) {
  const args = shellParse(curlCommand)
    .map((arg) => {
      if (typeof arg === 'object' && 'op' in arg && arg.op === 'glob') {
        return arg.pattern.trim()
      }
      return typeof arg === 'string' ? arg.trim() : arg
    })
    .filter((arg) => arg !== '')

  const result: {
    url: string
    method?: string
    headers?: Record<string, string>
    body?: string
    queryParameters?: Record<string, string>
    servers?: string[]
  } = { url: '' }

  const iterator = args[Symbol.iterator]()
  let arg = iterator.next().value

  while (arg) {
    if (typeof arg === 'object' && 'op' in arg) {
      arg = iterator.next().value
      continue
    }

    if (arg === '-X' || arg === '--request') {
      parseMethod(iterator as Iterator<string>, result)
    } else if (arg === '--url') {
      parseUrl(iterator as Iterator<string>, result)
    } else if (arg === '-H' || arg === '--header') {
      parseHeader(iterator as Iterator<string>, result)
    } else if (
      arg === '--data' ||
      arg === '-d' ||
      arg === '--data-raw' ||
      arg === '--data-urlencode' ||
      arg === '--data-binary' ||
      arg === '--data-ascii'
    ) {
      const nextArg = iterator.next().value
      if (typeof nextArg === 'string') {
        result.body = nextArg
      }
    } else if (
      typeof arg === 'string' &&
      !result.url &&
      (arg.startsWith('http') || arg.startsWith('www.'))
    ) {
      parseUrl([arg][Symbol.iterator]() as Iterator<string>, result)
    } else if (arg === '-P') {
      parseQueryParam(iterator as Iterator<string>, result)
    } else if (
      typeof arg === 'string' &&
      arg.toLowerCase().includes('content-type')
    ) {
      parseContentType(arg, result)
    } else if (arg === '-u' || arg === '--user') {
      parseAuth(iterator as Iterator<string>, result)
    } else if (arg === '-b' || arg === '--cookie') {
      parseCookie(iterator as Iterator<string>, result)
    }
    arg = iterator.next().value
  }

  return {
    ...result,
    queryParameters: {
      ...parseQueryParameters(result.url),
      ...result.queryParameters,
    },
  }
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

  // Extract query parameters from the URL
  result.queryParameters = result.queryParameters || {}
  const queryString = url.search.substring(1)
  if (queryString) {
    queryString.split('&').forEach((param) => {
      parseQueryParam([param][Symbol.iterator]() as Iterator<string>, result)
    })
  }
}

/** Get the headers from a curl command */
function parseHeader(iterator: Iterator<string>, result: any) {
  const header = iterator.next().value.replace(/['"]/g, '').split(/:(.*)/)
  result.headers = result.headers || {}
  if (header[1] !== undefined) {
    result.headers[header[0].trim()] = header[1].trim()
  } else {
    result.headers[header[0].trim()] = ''
  }
}

/** Get the {query} parameters from a curl command */
function parseQueryParam(iterator: Iterator<string>, result: any) {
  const param = iterator.next().value.replace(/['"]/g, '').split('=')
  result.queryParameters = result.queryParameters || {}
  if (param[1] !== undefined) {
    result.queryParameters[param[0].trim()] = param[1].trim()
  } else {
    result.queryParameters[param[0].trim()] = ''
  }
}

/** Get the ?query=parameters from a curl command */
function parseQueryParameters(url: string) {
  const paramPosition = url.indexOf('?')
  const queryParameters: Record<string, string> = {}
  if (paramPosition !== -1) {
    const paramsString = url.substring(paramPosition + 1)
    const params = paramsString.split('&') || []
    params.forEach((param) => {
      const splitParam = param.split('=')
      queryParameters[splitParam[0]] = splitParam[1]
    })
  }

  return queryParameters
}

/** Get the Content-Type header from a curl command */
function parseContentType(arg: string, result: any) {
  const header = arg.replace(/['"]/g, '').split(/:(.+)/)
  result.headers = result.headers || {}
  if (header[1] !== undefined) {
    result.headers[header[0].trim()] = header[1].trim()
  } else {
    result.headers[header[0].trim()] = ''
  }
}

/** Get the Authorization header from a curl command */
function parseAuth(iterator: Iterator<string>, result: any) {
  const auth = iterator.next().value.split(':')
  result.headers = result.headers || {}
  result.headers['Authorization'] = auth[1]
}

/** Get the Cookie header from a curl command */
function parseCookie(iterator: Iterator<string>, result: any) {
  const cookie = iterator.next().value
  result.headers = result.headers || {}
  result.headers['Cookie'] = cookie
}
