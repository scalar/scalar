import type { Plugin } from '@scalar/types/snippetz'

import { buildFormData, formDataHeaders } from '@/libs/form-data'
import { buildQueryString, normalizeMethod } from '@/libs/http'
import { Raw, objectToString } from '@/libs/javascript'

/**
 * node/fetch
 */
export const nodeFetch: Plugin = {
  target: 'node',
  client: 'fetch',
  title: 'Fetch',
  generate(request) {
    // Defaults
    const normalizedRequest = {
      method: 'GET',
      ...request,
    }

    let prefix = ''

    // Normalization
    normalizedRequest.method = normalizeMethod(normalizedRequest.method)

    // Reset fetch defaults
    const options: Record<string, any> = {
      method: normalizedRequest.method === 'GET' ? undefined : normalizedRequest.method,
    }

    // Query
    const queryString = buildQueryString(normalizedRequest.queryString)

    // Headers
    const headers = formDataHeaders(normalizedRequest)
    if (headers?.length) {
      options.headers = {}
      headers.forEach((header) => {
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
      const { mimeType, text, params } = normalizedRequest.postData

      if (mimeType === 'application/json' && text) {
        try {
          options.body = new Raw(`JSON.stringify(${objectToString(JSON.parse(text))})`)
        } catch {
          options.body = text
        }
      } else if (mimeType === 'multipart/form-data' && params) {
        prefix = `${buildFormData(params, 'node').join('\n')}\n\n`
        options.body = new Raw('formData')
      } else if (mimeType === 'application/x-www-form-urlencoded' && params) {
        const form = Object.fromEntries(params.map((p) => [p.name, p.value]))
        options.body = new Raw(`new URLSearchParams(${objectToString(form)})`)
      } else {
        options.body = normalizedRequest.postData.text
      }
    }

    // Transform to JSON
    const jsonOptions = Object.keys(options).length ? `, ${objectToString(options)}` : ''

    // Code Template
    return `${prefix}fetch('${normalizedRequest.url}${queryString}'${jsonOptions})`
  },
}
