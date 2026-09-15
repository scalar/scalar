import type { Plugin } from '@scalar/types/snippetz'

import { quoteJava } from '@/libs/java'
import { prepareRequest } from '@/libs/prepare-request'

/** Generates an OkHttp request with native form and multipart builders. */
export const javaOkhttp: Plugin = {
  target: 'java',
  client: 'okhttp',
  title: 'OkHttp',
  generate(request, configuration) {
    const { url, method, headers } = prepareRequest(request, configuration)
    // OkHttp rejects every non-null body for GET and HEAD, including an empty one.
    const postData = ['GET', 'HEAD'].includes(method) ? undefined : request?.postData
    const multipart = postData?.mimeType === 'multipart/form-data' && postData.params
    const form = postData?.mimeType === 'application/x-www-form-urlencoded' && postData.params
    const lines = ['OkHttpClient client = new OkHttpClient();', '']
    if (multipart) {
      lines.push('RequestBody body = new MultipartBody.Builder()', '  .setType(MultipartBody.FORM)')
      for (const param of multipart) {
        const name = quoteJava(param.name)
        const value = quoteJava(param.value ?? '')
        if (param.fileName !== undefined) {
          lines.push(
            `  .addFormDataPart(${name}, ${quoteJava(param.fileName)}, RequestBody.create(MediaType.parse(${quoteJava(param.contentType ?? 'application/octet-stream')}), new java.io.File(${quoteJava(param.fileName)})))`,
          )
        } else if (param.contentType) {
          lines.push(
            `  .addFormDataPart(${name}, null, RequestBody.create(MediaType.parse(${quoteJava(param.contentType)}), ${value}))`,
          )
        } else {
          lines.push(`  .addFormDataPart(${name}, ${value})`)
        }
      }
      lines.push('  .build();', '')
    } else if (form) {
      lines.push('RequestBody body = new FormBody.Builder()')
      for (const param of form) {
        lines.push(`  .add(${quoteJava(param.name)}, ${quoteJava(param.value ?? '')})`)
      }
      lines.push('  .build();', '')
    } else if (postData) {
      lines.push(
        `RequestBody body = RequestBody.create(${postData.mimeType ? `MediaType.parse(${quoteJava(postData.mimeType)})` : 'null'}, ${quoteJava(postData.text ?? '')});`,
        '',
      )
    }
    const emptyBody = ['POST', 'PUT', 'PATCH', 'PROPPATCH', 'REPORT'].includes(method)
      ? 'RequestBody.create(null, "")'
      : 'null'
    const body = postData ? 'body' : emptyBody
    lines.push(
      'Request request = new Request.Builder()',
      `  .url(${quoteJava(url)})`,
      `  .method(${quoteJava(method)}, ${body})`,
    )
    for (const { name, value } of headers) {
      // OkHttp sets the multipart boundary when it writes the body.
      if (!multipart || name.toLowerCase() !== 'content-type') {
        lines.push(`  .addHeader(${quoteJava(name)}, ${quoteJava(value)})`)
      }
    }
    lines.push(
      '  .build();',
      '',
      'try (Response response = client.newCall(request).execute()) {',
      '  System.out.println(response.body().string());',
      '}',
    )
    return lines.join('\n')
  },
}
