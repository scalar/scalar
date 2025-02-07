import type { Plugin } from '@/types'

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
    } catch (error) {
      // Use the provided URL directly if parsing fails
      path = normalizedRequest.url || '/'
    }

    const hostname = url?.hostname || 'UNKNOWN_HOSTNAME'

    // Start building the request
    let requestString = `${normalizedRequest.method} ${path} HTTP/1.1\r\n`

    // Handle query string parameters
    if (normalizedRequest.queryString.length) {
      const queryString = normalizedRequest.queryString
        .map(
          (param) =>
            `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value)}`,
        )
        .join('&')
      // Append query string to the path
      requestString = `${normalizedRequest.method} ${path}?${queryString} HTTP/1.1\r\n`
    }

    // Host header
    requestString += `Host: ${hostname}\r\n`

    // Headers
    const headers = new Map()
    normalizedRequest.headers.forEach((header) => {
      if (headers.has(header.name)) {
        headers.set(header.name, `${headers.get(header.name)}, ${header.value}`)
      } else {
        headers.set(header.name, header.value)
      }
    })

    headers.forEach((value, name) => {
      requestString += `${name}: ${value}\r\n`
    })

    // Ensure headers with empty values are included
    normalizedRequest.headers.forEach((header) => {
      if (!headers.has(header.name) && header.value === '') {
        requestString += `${header.name}:\r\n`
      }
    })

    // Handle query string parameters
    if (normalizedRequest.queryString.length) {
      const queryString = normalizedRequest.queryString
        .map(
          (param) =>
            `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value)}`,
        )
        .join('&')
      // Append query string to the path
      requestString =
        `${normalizedRequest.method} ${path}?${queryString} HTTP/1.1\r\n` +
        `Host: ${url.hostname}\r\n`
    }

    // Handle postData
    if (normalizedRequest.postData) {
      if (
        normalizedRequest.postData.mimeType === 'application/json' &&
        normalizedRequest.postData.text
      ) {
        requestString += `Content-Type: application/json\r\n\r\n${normalizedRequest.postData.text}`
      } else if (
        normalizedRequest.postData.mimeType === 'application/octet-stream' &&
        normalizedRequest.postData.text
      ) {
        requestString += `Content-Type: application/octet-stream\r\n\r\n${normalizedRequest.postData.text}`
      } else if (
        normalizedRequest.postData.mimeType ===
          'application/x-www-form-urlencoded' &&
        normalizedRequest.postData.params
      ) {
        const formData = normalizedRequest.postData.params
          .map(
            (param) =>
              `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value ?? '')}`,
          )
          .join('&')
        requestString += `Content-Type: application/x-www-form-urlencoded\r\n\r\n${formData}`
      } else if (
        normalizedRequest.postData.mimeType === 'multipart/form-data' &&
        normalizedRequest.postData.params
      ) {
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
        requestString += `Content-Type: multipart/form-data; boundary=${boundary}\r\n\r\n`
        normalizedRequest.postData.params.forEach((param) => {
          if (param.fileName) {
            requestString += `--${boundary}\r\nContent-Disposition: form-data; name="${param.name}"; filename="${param.fileName}"\r\n\r\n`
          } else {
            requestString += `--${boundary}\r\nContent-Disposition: form-data; name="${param.name}"\r\n\r\n${param.value}\r\n`
          }
        })
        requestString += `--${boundary}--\r\n`
      }
    } else {
      requestString += '\r\n'
    }

    return requestString
  },
}
