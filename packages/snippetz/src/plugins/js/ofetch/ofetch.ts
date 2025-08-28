import { objectToString } from '@/utils/objectToString'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * js/ofetch
 */
export const jsOfetch: Plugin = {
  target: 'js',
  client: 'ofetch',
  title: 'ofetch',
  generate(request) {
    // Defaults
    const normalizedRequest = {
      method: 'GET',
      ...request,
    }

    // Normalization
    normalizedRequest.method = normalizedRequest.method.toUpperCase()

    // Reset fetch defaults
    const options: Record<string, any> = {
      method: normalizedRequest.method === 'GET' ? undefined : normalizedRequest.method,
    }

    // Query
    if (normalizedRequest.queryString?.length) {
      options.query = Object.fromEntries(normalizedRequest.queryString.map((q) => [q.name, q.value]))
    }

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
        options.body = JSON.parse(options.body)
      }
    }

    // Transform to JSON
    const jsonOptions = Object.keys(options).length ? `, ${objectToString(options)}` : ''

    // Code Template
    return `import { ofetch } from 'ofetch'

ofetch('${normalizedRequest.url}'${jsonOptions})`
  },
}
