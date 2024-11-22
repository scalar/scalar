import type { PluginConfiguration, Request, Source } from '../../../core'

/**
 * shell/curl
 */
export function curl(
  request?: Partial<Request>,
  configuration?: PluginConfiguration,
): Source {
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
    parts.push(`--request ${normalizedRequest.method}`)
  }

  // Basic Auth
  if (configuration?.auth?.username && configuration?.auth?.password) {
    parts.push(
      `--user '${configuration.auth.username}:${configuration.auth.password}'`,
    )
  }

  // Headers
  if (normalizedRequest.headers?.length) {
    normalizedRequest.headers.forEach((header) => {
      parts.push(`--header '${header.name}: ${header.value}'`)
    })
  }

  // Cookies
  if (normalizedRequest.cookies?.length) {
    const cookieString = normalizedRequest.cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ')
    parts.push(`--cookie '${cookieString}'`)
  }

  // Body
  if (normalizedRequest.postData) {
    if (normalizedRequest.postData.mimeType === 'application/json') {
      parts.push(`--data '${normalizedRequest.postData.text}'`)
    } else {
      parts.push(`--data "${normalizedRequest.postData.text}"`)
    }
  }

  return {
    target: 'shell',
    client: 'curl',
    code: parts.join(' \\\n  '),
  }
}
