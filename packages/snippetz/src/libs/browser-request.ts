import type { HarRequest, PluginConfiguration } from '@scalar/types/snippetz'
import { Base64 } from 'js-base64'

import { joinUrlAndQuery, normalizeMethod } from './http'

/** Builds browser request values without collapsing repeated headers or form fields. */
export const prepareBrowserRequest = (
  request: Partial<HarRequest> = {},
  configuration?: PluginConfiguration,
): {
  url: string
  method: string
  headers: { name: string; value: string }[]
  setup: string[]
  body: string
  withCredentials: boolean
} => {
  // Browsers forbid setting Cookie directly. Header values are already serialized,
  // so preserve their escaping when transferring them to the browser cookie store.
  const cookieValues = [
    ...(request.cookies ?? []).map(({ name, value }) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`),
    ...(request.headers ?? [])
      .filter(({ name }) => name.toLowerCase() === 'cookie')
      .flatMap(({ value }) => (value ?? '').split(';').map((cookie) => cookie.trim()))
      .filter((cookie) => cookie.includes('=')),
  ]
  const headers = (request.headers ?? []).filter(({ name }) => name.toLowerCase() !== 'cookie')
  if (configuration?.auth?.username && configuration.auth.password) {
    headers.push({
      name: 'Authorization',
      value: `Basic ${Base64.encode(`${configuration.auth.username}:${configuration.auth.password}`)}`,
    })
  }
  const setup: string[] = []
  if (cookieValues.length) {
    setup.push('// Run on the request origin to set these cookies in the browser.')
    for (const cookie of cookieValues) {
      setup.push(`document.cookie = ${JSON.stringify(`${cookie}; path=/`)};`)
    }
  }
  const postData = request.postData
  const multipart = postData?.mimeType === 'multipart/form-data' && postData.params
  const form = postData?.mimeType === 'application/x-www-form-urlencoded' && postData.params
  if (multipart) {
    setup.push('const body = new FormData();')
    const uploads = multipart.filter((param) => param.fileName !== undefined && param.value === undefined)
    if (uploads.length) {
      setup.push('// Select upload files with an <input type="file" multiple> element first.')
      setup.push(`const files = document.querySelector('input[type="file"]').files;`)
    }
    for (const param of multipart) {
      const name = JSON.stringify(param.name)
      const value = JSON.stringify(param.value ?? '')
      if (param.fileName !== undefined) {
        const contents = param.value === undefined ? `files[${uploads.indexOf(param)}]` : value
        setup.push(
          `body.append(${name}, new File([${contents}], ${JSON.stringify(param.fileName)}, { type: ${JSON.stringify(param.contentType ?? 'application/octet-stream')} }));`,
        )
      } else if (param.contentType) {
        setup.push(`body.append(${name}, new Blob([${value}], { type: ${JSON.stringify(param.contentType)} }));`)
      } else {
        setup.push(`body.append(${name}, ${value});`)
      }
    }
  } else if (form) {
    setup.push('const body = new URLSearchParams();')
    for (const param of form) {
      setup.push(`body.append(${JSON.stringify(param.name)}, ${JSON.stringify(param.value ?? '')});`)
    }
  }
  if (postData?.mimeType && !multipart && !headers.some(({ name }) => name.toLowerCase() === 'content-type')) {
    headers.push({ name: 'Content-Type', value: postData.mimeType })
  }
  const textBody = postData ? JSON.stringify(postData.text ?? '') : 'null'
  const formBody = form ? 'body.toString()' : textBody
  return {
    url: joinUrlAndQuery(request.url ?? '', request.queryString),
    method: normalizeMethod(request.method),
    // The browser must supply the boundary matching its FormData serialization.
    headers: multipart ? headers.filter(({ name }) => name.toLowerCase() !== 'content-type') : headers,
    setup,
    withCredentials: Boolean(cookieValues.length),
    body: multipart ? 'body' : formBody,
  }
}
