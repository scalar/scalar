import { redirectToProxy } from '@scalar/helpers/url/redirect-to-proxy'
import type { ExternalUrls } from '@scalar/types/api-reference'

/** Type guard for the response body */
function isResponseBody(data: unknown): data is { url: string } {
  return !!data && typeof data === 'object' && 'url' in data && typeof (data as any).url === 'string'
}

/** Upload a document and return a temporary URL */
export async function uploadTempDocument(
  document: string,
  urls: Pick<ExternalUrls, 'proxyUrl' | 'apiBaseUrl'>,
): Promise<string> {
  const body = JSON.stringify({ document })
  const uploadUrl = `${urls.apiBaseUrl}/core/share/upload/apis`

  // Proxy the request to avoid localhost CORS issues
  const response = await fetch(redirectToProxy(urls.proxyUrl, uploadUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  if (!response.ok) {
    throw new Error(` Failed to generate temporary link, server responded with ${response.status}`)
  }
  const data = (await response.json()) as unknown

  if (!isResponseBody(data)) {
    throw new Error('Failed to generate temporary link, invalid response from server')
  }

  return data.url
}
