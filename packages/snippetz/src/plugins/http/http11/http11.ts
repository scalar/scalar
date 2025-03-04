import type { Plugin } from '@scalar/types/snippetz'

/**
 * http/http1.1
 */
export const httpHttp11: Plugin = {
  target: 'http',
  client: 'http1.1',
  title: 'HTTP/1.1',
  generate(request) {
    // Defaults
    const normalizedRequest = {
      method: 'GET',
      headers: [],
      queryString: [],
      ...request,
    }

    // Normalize method
    normalizedRequest.method = normalizedRequest.method.toUpperCase()

    // Parse URL with error handling
    let url
    let path
    try {
      url = new URL(normalizedRequest.url || 'http://')
      path = url.pathname + (url.search || '')
    } catch (_error) {
      // Oops, got an invalid URL, use the provided URL directly.
      path = normalizedRequest.url || '/'
    }

    const hostname = url?.hostname || 'UNKNOWN_HOSTNAME'

    // Start building the request
    let requestString = `${normalizedRequest.method} ${path} HTTP/1.1\r\n`

    // Handle query string parameters
    if (normalizedRequest.queryString.length) {
      const queryString = normalizedRequest.queryString
        .map((param) => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value)}`)
        .join('&')

      // Append query string to the path
      requestString = `${normalizedRequest.method} ${path}?${queryString} HTTP/1.1\r\n`
    }

    // Store all headers
    const headers = new Map()

    // Host header
    headers.set('Host', hostname)

    // Passed headers
    normalizedRequest.headers.forEach((header) => {
      if (headers.has(header.name)) {
        headers.set(header.name, `${headers.get(header.name)}, ${header.value}`)
      } else {
        headers.set(header.name, header.value)
      }
    })

    // Query string parameters
    if (normalizedRequest.queryString.length) {
      const queryString = normalizedRequest.queryString
        .map((param) => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value)}`)
        .join('&')

      // Append query string to the path
      requestString = `${normalizedRequest.method} ${path}?${queryString} HTTP/1.1\r\n`
    }

    // Request body
    let body = ''
    if (normalizedRequest.postData) {
      // Always set the Content-Type header based on postData.mimeType
      if (normalizedRequest.postData.mimeType === 'application/json' && normalizedRequest.postData.text) {
        headers.set('Content-Type', 'application/json')
        body = normalizedRequest.postData.text
      } else if (
        normalizedRequest.postData.mimeType === 'application/octet-stream' &&
        normalizedRequest.postData.text
      ) {
        headers.set('Content-Type', 'application/octet-stream')
        body = normalizedRequest.postData.text
      } else if (
        normalizedRequest.postData.mimeType === 'application/x-www-form-urlencoded' &&
        normalizedRequest.postData.params
      ) {
        const formData = normalizedRequest.postData.params
          .map((param) => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value ?? '')}`)
          .join('&')

        headers.set('Content-Type', 'application/x-www-form-urlencoded')
        body = formData
      } else if (normalizedRequest.postData.mimeType === 'multipart/form-data' && normalizedRequest.postData.params) {
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
        headers.set('Content-Type', `multipart/form-data; boundary=${boundary}`)

        body =
          normalizedRequest.postData.params
            .map((param) => {
              if (param.fileName) {
                return `--${boundary}\r\nContent-Disposition: form-data; name="${param.name}"; filename="${param.fileName}"\r\n\r\n`
              }
              return `--${boundary}\r\nContent-Disposition: form-data; name="${param.name}"\r\n\r\n${param.value}\r\n`
            })
            .join('') + `--${boundary}--\r\n`
      }
    }

    // Add headers to requestString
    headers.forEach((value, name) => {
      requestString += `${name}: ${value}\r\n`
    })

    // Add body to requestString
    requestString += `\r\n${body}`

    return requestString
  },
}
