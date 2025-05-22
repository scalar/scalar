import { createSearchParams } from '@/utils/create-search-params'
import { objectToString, Unquoted } from '@/utils/objectToString'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * node/undici
 */
export const nodeUndici: Plugin = {
  target: 'node',
  client: 'undici',
  title: 'undici',
  generate(request) {
    // Defaults
    const normalizedRequest = {
      method: 'GET',
      ...request,
    }

    // Normalization
    normalizedRequest.method = normalizedRequest.method.toUpperCase()

    // Reset undici defaults
    const options: Record<string, any> = {
      method: normalizedRequest.method === 'GET' ? undefined : normalizedRequest.method,
    }

    // Query
    const searchParams = createSearchParams(normalizedRequest.queryString)
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
        options.body = new Unquoted(`JSON.stringify(${objectToString(JSON.parse(options.body))})`)
      }
    }

    // Transform to JSON
    const jsonOptions = Object.keys(options).length ? `, ${objectToString(options)}` : ''

    // Code Template
    return `import { request } from 'undici'

const { statusCode, body } = await request('${normalizedRequest.url}${queryString}'${jsonOptions})`
  },
}
