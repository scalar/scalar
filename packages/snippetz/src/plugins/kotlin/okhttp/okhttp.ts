import type { Plugin } from '@scalar/types/snippetz'

import { collectHeaders, joinUrlAndQuery, normalizeMethod, normalizeUrl } from '@/libs/http'

/** Methods OkHttp exposes as dedicated builder calls (anything else uses `.method(...)`). */
const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']

/** Methods that accept a request body through their dedicated builder call. */
const METHODS_WITH_BODY = ['POST', 'PUT', 'DELETE', 'PATCH']

/** Wrap a value in double quotes, escaping anything that would break the Kotlin string. */
const quote = (value: string): string => JSON.stringify(value).replaceAll('$', '\\$')

/**
 * kotlin/okhttp
 */
export const kotlinOkhttp: Plugin = {
  target: 'kotlin',
  client: 'okhttp',
  title: 'OkHttp',
  generate(request, configuration) {
    const method = normalizeMethod(request?.method)
    const url = normalizeUrl(joinUrlAndQuery(request?.url ?? '', request?.queryString))
    const postData = request?.postData

    const lines: string[] = ['val client = OkHttpClient()', '']

    // Body. Whenever a `val body` is emitted below, `hasBody` flips so the request
    // builder passes it through for both dedicated and custom method calls.
    let hasBody = false
    if (postData?.mimeType === 'application/x-www-form-urlencoded' && postData.params) {
      lines.push('val body = FormBody.Builder()')
      postData.params.forEach((param) => {
        lines.push(`  .add(${quote(param.name ?? '')}, ${quote(param.value ?? '')})`)
      })
      lines.push('  .build()', '')
      hasBody = true
    } else if (postData?.mimeType === 'multipart/form-data' && postData.params) {
      lines.push('val body = MultipartBody.Builder()', '  .setType(MultipartBody.FORM)')
      postData.params.forEach((param) => {
        if (param.fileName !== undefined) {
          lines.push(
            `  .addFormDataPart(${quote(param.name ?? '')}, ${quote(param.fileName)}, RequestBody.create(MediaType.parse(${quote(param.contentType ?? 'application/octet-stream')}), File(${quote(param.fileName)})))`,
          )
        } else if (param.contentType) {
          lines.push(
            `  .addFormDataPart(${quote(param.name)}, null, RequestBody.create(MediaType.parse(${quote(param.contentType)}), ${quote(param.value ?? '')}))`,
          )
        } else {
          lines.push(`  .addFormDataPart(${quote(param.name)}, ${quote(param.value ?? '')})`)
        }
      })
      lines.push('  .build()', '')
      hasBody = true
    } else if (postData) {
      lines.push(`val mediaType = MediaType.parse(${quote(postData.mimeType ?? '')})`)
      lines.push(`val body = RequestBody.create(mediaType, ${quote(postData.text ?? '')})`)
      hasBody = true
    }

    // Request builder
    lines.push('val request = Request.Builder()', `  .url(${quote(url)})`)

    // Method, mirroring OkHttp's dedicated builder calls and the generic `.method(...)` fallback
    const emptyBody = ['POST', 'PUT', 'PATCH', 'PROPPATCH', 'REPORT'].includes(method)
      ? 'RequestBody.create(null, "")'
      : 'null'
    const bodyArg = hasBody ? 'body' : emptyBody
    if (!METHODS.includes(method)) {
      lines.push(`  .method(${quote(method)}, ${bodyArg})`)
    } else if (METHODS_WITH_BODY.includes(method)) {
      lines.push(`  .${method.toLowerCase()}(${bodyArg})`)
    } else {
      lines.push(`  .${method.toLowerCase()}()`)
    }

    // Basic auth, expressed through OkHttp's Credentials helper
    if (configuration?.auth?.username && configuration?.auth?.password) {
      lines.push(
        `  .addHeader("Authorization", Credentials.basic(${quote(configuration.auth.username)}, ${quote(configuration.auth.password)}))`,
      )
    }
    // Headers, including cookies folded into a single Cookie header
    ;[...(request?.headers ?? []), ...collectHeaders([], request?.cookies)].forEach((header) => {
      lines.push(`  .addHeader(${quote(header.name)}, ${quote(header.value)})`)
    })

    lines.push('  .build()', '', 'val response = client.newCall(request).execute()')

    return lines.join('\n')
  },
}
