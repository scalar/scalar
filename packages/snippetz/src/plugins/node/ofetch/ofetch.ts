import type { Plugin } from '@scalar/types/snippetz'

import { mergeCookieHeaders } from '@/libs/cookies'
import { buildFormData, formDataHeaders, urlSearchParams } from '@/libs/form-data'
import { normalizeMethod, reduceQueryParams } from '@/libs/http'
import { Raw, objectToString } from '@/libs/javascript'

/**
 * node/ofetch
 */
export const nodeOfetch: Plugin = {
  target: 'node',
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

    // Headers
    const headers = formDataHeaders({ ...normalizedRequest, headers: mergeCookieHeaders(normalizedRequest) })
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
        prefix = `${buildFormData(normalizedRequest.postData.params, 'node').join('\n')}\n\n`
        options.body = new Raw('formData')
      } else if (
        normalizedRequest.postData.mimeType === 'application/x-www-form-urlencoded' &&
        normalizedRequest.postData.params
      ) {
        options.body = new Raw(urlSearchParams(normalizedRequest.postData.params))
      } else {
        options.body = normalizedRequest.postData.text
      }

      // JSON
      if (normalizedRequest.postData.mimeType === 'application/json') {
        options.body = JSON.parse(options.body)
      }
    }

    // Transform to JSON
    const jsonOptions = Object.keys(options).length ? `, ${objectToString(options)}` : ''

    // Code Template
    return `import { ofetch } from 'ofetch'

${prefix}ofetch('${normalizedRequest.url}'${jsonOptions})`
  },
}
