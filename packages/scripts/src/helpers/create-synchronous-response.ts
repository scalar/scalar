import type { SynchronousResponse } from '@/types'

export async function createSynchronousResponse(response: Response): Promise<SynchronousResponse> {
  // Pre-fetch all the data we need synchronously
  const responseText = await response.text()

  return {
    // Pass through basic Response properties
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    ok: response.ok,
    redirected: response.redirected,
    type: response.type,
    url: response.url,
    bodyUsed: true, // Since we've consumed it

    // Store the body as string
    body: responseText,

    bytes: () => {
      throw new Error('Not implemented')
    },

    // Synchronous methods
    text: () => responseText,
    json: () => {
      try {
        return JSON.parse(responseText)
      } catch {
        throw new Error('Response is not valid JSON')
      }
    },
    clone: () => {
      throw new Error('Not implemented')
    },
    // We don't need to implement these as they're part of the Omit in the type definition
    arrayBuffer: () => {
      throw new Error('Not implemented')
    },
    blob: () => {
      throw new Error('Not implemented')
    },
    formData: () => {
      throw new Error('Not implemented')
    },
  }
}
