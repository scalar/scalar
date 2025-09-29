import { redirectToProxy } from '@scalar/oas-utils/helpers'

import { PROXY_URL, UPLOAD_TEMP_API_URL } from '@/consts/urls'

/** Type guard for the response body */
function isResponseBody(data: unknown): data is { url: string } {
  return !!data && typeof data === 'object' && 'url' in data && typeof (data as any).url === 'string'
}

/** Upload a document and return a temporary URL */
export async function uploadTempDocument(document: string): Promise<string> {
  const body = JSON.stringify({ document })

  // Proxy the request to avoid localhost CORS issues
  const response = await fetch(redirectToProxy(PROXY_URL, UPLOAD_TEMP_API_URL), {
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
