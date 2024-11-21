import type { PluginConfiguration, Request, Snippet } from '../../../core'

export function curl(
  request?: Partial<Request>,
  configuration?: PluginConfiguration,
): Snippet {
  // Defaults
  const normalizedRequest = {
    method: 'GET',
    ...request,
  }

  // Normalization
  normalizedRequest.method = normalizedRequest.method.toUpperCase()

  // Build curl command parts
  const parts: string[] = ['curl']

  // URL (quote if has query parameters)
  const queryString = normalizedRequest.queryString?.length
    ? '?' +
      normalizedRequest.queryString
        .map((param) => `${param.name}=${param.value}`)
        .join('&')
    : ''
  const url = `${normalizedRequest.url}${queryString}`
  const urlPart = queryString ? `'${url}'` : url
  parts[0] = `curl ${urlPart}`

  // Method
  if (normalizedRequest.method !== 'GET') {
    parts.push(`-X ${normalizedRequest.method}`)
  }

  // Basic Auth
  if (configuration?.auth?.username && configuration?.auth?.password) {
    parts.push(
      `-u '${configuration.auth.username}:${configuration.auth.password}'`,
    )
  }

  // Headers
  if (normalizedRequest.headers?.length) {
    normalizedRequest.headers.forEach((header) => {
      parts.push(`-H '${header.name}: ${header.value}'`)
    })
  }

  // Cookies
  if (normalizedRequest.cookies?.length) {
    const cookieString = normalizedRequest.cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ')
    parts.push(`-b '${cookieString}'`)
  }

  // Body
  if (normalizedRequest.postData) {
    if (normalizedRequest.postData.mimeType === 'application/json') {
      parts.push(`-d '${normalizedRequest.postData.text}'`)
    } else {
      parts.push(`-d "${normalizedRequest.postData.text}"`)
    }
  }

  return {
    target: 'shell',
    client: 'curl',
    code: parts.join(' \\\n  '),
  }
}
