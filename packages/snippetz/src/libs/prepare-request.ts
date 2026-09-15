import type { HarRequest, PluginConfiguration } from '@scalar/types/snippetz'
import { Base64 } from 'js-base64'

import { collectHeaders, joinUrlAndQuery, normalizeMethod, normalizeUrl } from './http'

/** A body segment is either literal UTF-8 text or a file read when the snippet runs. */
export type BodySegment = { text: string } | { file: string }

/** Request values shared by generators that serialize a body explicitly. */
type PreparedRequest = {
  url: string
  method: string
  headers: { name: string; value: string }[]
  body: BodySegment[] | undefined
}

/** Prevent names and filenames from terminating a multipart disposition parameter. */
const dispositionValue = (value: string): string =>
  value.replaceAll('\r', '%0D').replaceAll('\n', '%0A').replaceAll('"', '%22')

/** Preserve repeated fields, file uploads, and part media types in a multipart body. */
const multipartBody = (
  params: NonNullable<NonNullable<HarRequest['postData']>['params']>,
): {
  contentType: string
  body: BodySegment[]
} => {
  // Keep snippets deterministic while avoiding boundaries present in the supplied values.
  const values = JSON.stringify(params)
  let boundary = 'scalar-boundary'
  while (values.includes(boundary)) {
    boundary += '-'
  }
  const body: BodySegment[] = []
  for (const param of params) {
    const filename = param.fileName !== undefined ? `; filename="${dispositionValue(param.fileName)}"` : ''
    const contentType = param.contentType ?? (param.fileName !== undefined ? 'application/octet-stream' : undefined)
    body.push({
      text: `--${boundary}\r\nContent-Disposition: form-data; name="${dispositionValue(param.name)}"${filename}\r\n${contentType ? `Content-Type: ${contentType}\r\n` : ''}\r\n`,
    })
    body.push(param.fileName !== undefined ? { file: param.fileName } : { text: param.value ?? '' })
    body.push({ text: '\r\n' })
  }
  body.push({ text: `--${boundary}--\r\n` })
  return { contentType: `multipart/form-data; boundary=${boundary}`, body }
}

/** Normalize HAR values without dropping duplicate headers, cookies, query parameters, or empty bodies. */
export const prepareRequest = (
  request: Partial<HarRequest> = {},
  configuration?: PluginConfiguration,
): PreparedRequest => {
  const headers = [...(request.headers ?? []), ...collectHeaders([], request.cookies)]
  if (configuration?.auth?.username && configuration.auth.password) {
    headers.push({
      name: 'Authorization',
      value: `Basic ${Base64.encode(`${configuration.auth.username}:${configuration.auth.password}`)}`,
    })
  }
  const postData = request.postData
  const multipart =
    postData?.mimeType === 'multipart/form-data' && postData.params ? multipartBody(postData.params) : undefined
  const body =
    multipart?.body ??
    (postData
      ? [
          {
            text:
              postData.mimeType === 'application/x-www-form-urlencoded' && postData.params
                ? new URLSearchParams(postData.params.map(({ name, value }) => [name, value ?? ''])).toString()
                : (postData.text ?? ''),
          },
        ]
      : undefined)
  const contentType = multipart?.contentType ?? postData?.mimeType
  const bodyHeaders = multipart ? headers.filter(({ name }) => name.toLowerCase() !== 'content-type') : headers
  if (contentType && !bodyHeaders.some(({ name }) => name.toLowerCase() === 'content-type')) {
    bodyHeaders.push({ name: 'Content-Type', value: contentType })
  }
  return {
    url: normalizeUrl(joinUrlAndQuery(request.url ?? '', request.queryString)),
    method: normalizeMethod(request.method),
    headers: bodyHeaders,
    body,
  }
}
