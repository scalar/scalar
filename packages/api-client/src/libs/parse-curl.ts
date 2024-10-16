import type { RequestMethod } from '@scalar/oas-utils/entities/spec'
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
    method?: RequestMethod
    headers?: Record<string, string>
    body?: string
    queryParameters?: Record<string, string>
    servers?: string[]
  } = { url: '' }

  const iterator = args[Symbol.iterator]()
  let arg = iterator.next().value

  while (arg) {
    if (typeof arg === 'object' && 'op' in arg) {
      if (arg.op === '&') {
        // Extract query parameters
        const nextArg = iterator.next().value
        if (typeof nextArg === 'string') {
          const queryParametersArray = parseQueryParameters(`?${nextArg}`)
          const queryParameters = queryParametersArray.reduce(
            (acc, { key, value }) => {
              acc[key] = value
              return acc
            },
            {} as Record<string, string>,
          )
          result.queryParameters = {
            ...result.queryParameters,
            ...queryParameters,
          }
        }
      }
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
      parsePathVariables(iterator as Iterator<string>, result)
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

  // Extract query parameters
  result.queryParameters = parseQueryParameters(url.search)
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
  const paramPosition = url.indexOf('?')
  const queryParameters: Array<{ key: string; value: string }> = []
  if (paramPosition !== -1) {
    const paramsString = url.substring(paramPosition + 1)
    const params = paramsString.split('&')
    params.forEach((param) => {
      const [key, value] = param.split('=')
      const decodedKey = decodeURIComponent(key.trim())
      const decodedValue = value ? decodeURIComponent(value.trim()) : ''

      queryParameters.push({ key: decodedKey, value: decodedValue })
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
