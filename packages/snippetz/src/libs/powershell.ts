import type { HarRequest, PluginConfiguration } from '@scalar/types/snippetz'

import { multipartFileBoundary, prepareRequest } from './prepare-request'

/** Double every PowerShell single-quote delimiter, including smart apostrophes, to keep values literal. */
const quote = (value: string): string => `'${value.replace(/['\u2018-\u201b]/g, (quote) => quote + quote)}'`

/** Generate the common request arguments for PowerShell 7 HTTP cmdlets. */
export const generatePowershell = (
  command: 'Invoke-RestMethod' | 'Invoke-WebRequest',
  request: Partial<HarRequest> = {},
  configuration?: PluginConfiguration,
): string => {
  const prepared = prepareRequest(request, configuration)
  const { url, method, headers, body } = prepared
  const boundary = multipartFileBoundary(prepared)
  const literal = (value: string): string =>
    boundary ? `(${quote(value)}).Replace(${quote(boundary)}, $boundary)` : quote(value)
  const lines: string[] = boundary ? ["$boundary = [guid]::NewGuid().ToString('N')"] : []
  const headerNames = [...new Set(headers.map(({ name }) => name.toLowerCase()))]
  if (headers.length) {
    lines.push('$headers = @{')
    for (const name of headerNames) {
      const matches = headers.filter((header) => header.name.toLowerCase() === name)
      // HTTP cmdlets stringify header values; arrays would be sent as System.Object[].
      const value = matches.map((header) => header.value).join(name === 'cookie' ? '; ' : ', ')
      lines.push(`  ${quote(matches[0]?.name ?? name)} = ${name === 'content-type' ? literal(value) : quote(value)}`)
    }
    lines.push('}', '')
  }
  if (body) {
    lines.push('$body = [System.IO.MemoryStream]::new()')
    for (const segment of body) {
      lines.push(
        'file' in segment
          ? `$bytes = [System.IO.File]::ReadAllBytes(${quote(segment.file)})`
          : `$bytes = [System.Text.Encoding]::UTF8.GetBytes(${literal(segment.text)})`,
      )
      lines.push('$body.Write($bytes, 0, $bytes.Length)')
    }
    lines.push('')
  }
  const methodOption = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'TRACE', 'OPTIONS', 'MERGE', 'PATCH'].includes(method)
    ? '-Method'
    : '-CustomMethod'
  lines.push(
    `$response = ${command} -Uri ${quote(url)} ${methodOption} ${quote(method)}${headers.length ? ' -Headers $headers' : ''}${body ? ' -Body $body.ToArray()' : ''}`,
  )
  if (body) {
    lines.push('$body.Dispose()')
  }
  lines.push('$response')
  return lines.join('\n')
}
