import type { Plugin } from '@scalar/types/snippetz'

import { prepareBrowserCookies } from '@/libs/browser-request'
import { buildFormData, formDataHeaders } from '@/libs/form-data'
import { normalizeMethod, reduceQueryParams } from '@/libs/http'
import { Raw, objectToString } from '@/libs/javascript'

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
    normalizedRequest.method = normalizeMethod(normalizedRequest.method)

    // Reset fetch defaults
    const options: Record<string, any> = {
      method: normalizedRequest.method === 'GET' ? undefined : normalizedRequest.method,
    }

    // Query
    if (normalizedRequest.queryString?.length) {
      options.query = reduceQueryParams(normalizedRequest.queryString)
    }

    const { headers: cookieHeaders, setup, withCredentials } = prepareBrowserCookies(normalizedRequest)
    if (withCredentials) {
      options.credentials = 'include'
    }

    // Headers
    const headers = formDataHeaders({ ...normalizedRequest, headers: cookieHeaders })
    if (headers?.length) {
      options.headers = {}
      headers.forEach((header) => {
        options.headers![header.name] = header.value
      })
    }

    // Remove undefined keys
    Object.keys(options).forEach((key) => {
      if (options[key] === undefined) {
        delete options[key]
      }
    })

    let prefix = ''

    // Add body
    if (normalizedRequest.postData) {
      if (normalizedRequest.postData.mimeType === 'multipart/form-data' && normalizedRequest.postData.params) {
        prefix = `${buildFormData(normalizedRequest.postData.params, 'js').join('\n')}\n\n`
        options.body = new Raw('formData')
      } else {
        options.body = normalizedRequest.postData.text
      }

      // JSON
      if (normalizedRequest.postData.mimeType === 'application/json') {
        options.body = JSON.parse(options.body)
      }
    }

    prefix = `${setup.length ? `${setup.join('\n')}\n\n` : ''}${prefix}`

    // Transform to JSON
    const jsonOptions = Object.keys(options).length ? `, ${objectToString(options)}` : ''

    // Code Template
    return `import { ofetch } from 'ofetch'

${prefix}ofetch('${normalizedRequest.url}'${jsonOptions})`
  },
}
