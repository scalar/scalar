import type { Plugin } from '@scalar/types/snippetz'

import { mergeCookieHeaders } from '@/libs/cookies'
import { buildFormData, formDataHeaders, urlSearchParams } from '@/libs/form-data'
import { joinUrlAndQuery, normalizeMethod } from '@/libs/http'
import { Raw, escapeJsString, objectToString } from '@/libs/javascript'

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
    normalizedRequest.method = normalizeMethod(normalizedRequest.method)

    // Reset undici defaults
    const options: Record<string, any> = {
      method: normalizedRequest.method === 'GET' ? undefined : normalizedRequest.method,
    }

    // Query
    const url = joinUrlAndQuery(normalizedRequest.url ?? '', normalizedRequest.queryString)

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
        // The undici request API accepts a string body but not a URLSearchParams instance.
        options.body = new Raw(`${urlSearchParams(normalizedRequest.postData.params)}.toString()`)
      } else {
        options.body = normalizedRequest.postData.text
      }

      // JSON
      if (normalizedRequest.postData.mimeType === 'application/json') {
        options.body = new Raw(`JSON.stringify(${objectToString(JSON.parse(options.body))})`)
      }
    }

    // Transform to JSON
    const jsonOptions = Object.keys(options).length ? `, ${objectToString(options)}` : ''

    // Undici's encoder requires its own FormData class in a fresh Node process.
    const imports = prefix ? 'request, FormData' : 'request'

    // Code Template
    return `import { ${imports} } from 'undici'

${prefix}const { statusCode, body } = await request('${escapeJsString(url)}'${jsonOptions})`
  },
}
