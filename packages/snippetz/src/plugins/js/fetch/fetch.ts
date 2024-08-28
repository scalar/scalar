import {
  type Request,
  type Source,
  arrayToObject,
  objectToString,
} from '../../../core'

export function fetch(request?: Partial<Request>): Source {
  // Defaults
  const normalizedRequest = {
    method: 'GET',
    ...request,
  }

  // Normalization
  normalizedRequest.method = normalizedRequest.method.toUpperCase()

  // Reset fetch defaults
  const options: Record<string, any> = {
    method:
      normalizedRequest.method === 'GET' ? undefined : normalizedRequest.method,
  }

  // Query
  const searchParams = new URLSearchParams(
    normalizedRequest.queryString
      ? arrayToObject(normalizedRequest.queryString)
      : undefined,
  )
  const queryString = searchParams.size ? `?${searchParams.toString()}` : ''

  // Headers
  if (normalizedRequest.headers?.length) {
    options.headers = {}

    normalizedRequest.headers.forEach((header) => {
      options.headers![header.name] = header.value
    })
  }

  // Cookies
  if (normalizedRequest.cookies?.length) {
    options.headers = options.headers || {}

    normalizedRequest.cookies.forEach((cookie) => {
      options.headers!['Set-Cookie'] = options.headers!['Set-Cookie']
        ? `${options.headers!['Set-Cookie']}; ${cookie.name}=${cookie.value}`
        : `${cookie.name}=${cookie.value}`
    })
  }

  // Remove undefined keys
  Object.keys(options).forEach((key) => {
    if (options[key] === undefined) {
      delete options[key]
    }
  })

  // Add body
  if (normalizedRequest.postData) {
    // Plain text
    options.body = normalizedRequest.postData.text

    // JSON
    if (normalizedRequest.postData.mimeType === 'application/json') {
      options.body = `JSON.stringify(${objectToString(
        JSON.parse(options.body),
      )})`
    }
  }

  // Transform to JSON
  const jsonOptions = Object.keys(options).length
    ? `, ${objectToString(options)}`
    : ''

  // Code Template
  const code = `fetch('${normalizedRequest.url}${queryString}'${jsonOptions})`

  return {
    target: 'js',
    client: 'fetch',
    code,
  }
}
