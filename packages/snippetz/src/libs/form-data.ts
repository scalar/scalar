import type { HarRequest } from '@scalar/types/snippetz'

/** Build FormData using real file bytes while preserving repeated multipart fields. */
export const buildFormData = (
  params: NonNullable<NonNullable<HarRequest['postData']>['params']>,
  target: 'js' | 'node',
  variable = 'formData',
): string[] => {
  const uploads = params.filter(
    (param) =>
      param.fileName !== undefined &&
      (target === 'node' || param.value === undefined || param.value === `@${param.fileName}`),
  )
  const lines = [`const ${variable} = new FormData();`]
  if (uploads.length) {
    if (target === 'node') {
      lines.unshift("import { readFileSync } from 'node:fs';", '')
    } else {
      lines.push('// Select upload files with an <input type="file" multiple> element first.')
      lines.push(`const files = document.querySelector('input[type="file"]').files;`)
    }
  }
  for (const param of params) {
    const name = JSON.stringify(param.name)
    const value = JSON.stringify(param.value ?? '')
    if (param.fileName !== undefined) {
      const filename = JSON.stringify(param.fileName)
      const contents =
        target === 'node'
          ? `readFileSync(${filename})`
          : uploads.includes(param)
            ? `files[${uploads.indexOf(param)}]`
            : value
      lines.push(
        `${variable}.append(${name}, new File([${contents}], ${filename}, { type: ${JSON.stringify(param.contentType ?? 'application/octet-stream')} }));`,
      )
    } else if (param.contentType) {
      lines.push(`${variable}.append(${name}, new Blob([${value}], { type: ${JSON.stringify(param.contentType)} }));`)
    } else {
      lines.push(`${variable}.append(${name}, ${value});`)
    }
  }
  return lines
}

/** Let a FormData encoder set the Content-Type and matching boundary. */
export const formDataHeaders = (request: Partial<HarRequest>): HarRequest['headers'] | undefined =>
  request.postData?.mimeType === 'multipart/form-data' && request.postData.params
    ? request.headers?.filter(({ name }) => name.toLowerCase() !== 'content-type')
    : request.headers
