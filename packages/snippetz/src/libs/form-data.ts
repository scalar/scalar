import type { HarRequest } from '@scalar/types/snippetz'

import { Raw } from './javascript'
import { dispositionValue } from './prepare-request'

type MultipartParams = NonNullable<NonNullable<HarRequest['postData']>['params']>

/** Native FormData assigns a filename to typed Blobs, changing text parts into files. */
const hasTypedText = (params: MultipartParams): boolean =>
  params.some((param) => param.fileName === undefined && Boolean(param.contentType))

/** Build FormData using real file bytes while preserving repeated multipart fields. */
export const buildFormData = (params: MultipartParams, target: 'js' | 'node', variable = 'formData'): string[] => {
  const uploads = params.filter(
    (param) =>
      param.fileName !== undefined &&
      (target === 'node' || param.value === undefined || param.value === `@${param.fileName}`),
  )
  const explicit = hasTypedText(params)
  const lines = explicit ? [] : [`const ${variable} = new FormData();`]
  if (uploads.length) {
    if (target === 'node') {
      lines.unshift("import { readFileSync } from 'node:fs';", '')
    } else {
      lines.push('// Select upload files with an <input type="file" multiple> element first.')
      lines.push(`const files = document.querySelector('input[type="file"]').files;`)
    }
  }
  if (explicit) {
    lines.push(
      `const ${variable}Boundary = Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");`,
    )
    lines.push(`const ${variable} = new Blob([`)
  }
  for (const param of params) {
    const name = JSON.stringify(param.name)
    const value = JSON.stringify(param.value ?? '')
    const uploadContents = uploads.includes(param) ? `files[${uploads.indexOf(param)}]` : value
    const fileContents = target === 'node' ? `readFileSync(${JSON.stringify(param.fileName)})` : uploadContents
    if (explicit) {
      const filename = param.fileName !== undefined ? `; filename="${dispositionValue(param.fileName)}"` : ''
      const type = param.contentType ?? (param.fileName !== undefined ? 'application/octet-stream' : undefined)
      const header = `\r\nContent-Disposition: form-data; name="${dispositionValue(param.name)}"${filename}\r\n${type ? `Content-Type: ${type}\r\n` : ''}\r\n`
      const contents =
        param.fileName !== undefined ? fileContents : JSON.stringify((param.value ?? '').replace(/\r\n|\r|\n/g, '\r\n'))
      lines.push(`  "--" + ${variable}Boundary + ${JSON.stringify(header)},`)
      lines.push(`  ${contents},`)
      lines.push('  "\\r\\n",')
    } else if (param.fileName !== undefined) {
      const filename = JSON.stringify(param.fileName)
      const contents = fileContents
      lines.push(
        `${variable}.append(${name}, new File([${contents}], ${filename}, { type: ${JSON.stringify(param.contentType ?? 'application/octet-stream')} }));`,
      )
    } else {
      lines.push(`${variable}.append(${name}, ${value});`)
    }
  }
  if (explicit) {
    lines.push(`  "--" + ${variable}Boundary + "--\\r\\n",`)
    lines.push(`], { type: "multipart/form-data; boundary=" + ${variable}Boundary });`)
  }
  return lines
}

/** Match encoder-owned boundaries and preserve raw multipart headers. */
export const formDataHeaders = (
  request: Partial<HarRequest>,
  variable = 'formData',
): { name: string; value: string | Raw }[] | undefined => {
  const params = request.postData?.mimeType === 'multipart/form-data' ? request.postData.params : undefined
  if (!params) {
    return request.headers
  }
  const headers: { name: string; value: string | Raw }[] =
    request.headers?.filter(({ name }) => name.toLowerCase() !== 'content-type') ?? []
  if (hasTypedText(params)) {
    headers.push({ name: 'Content-Type', value: new Raw(`${variable}.type`) })
  }
  return headers
}
