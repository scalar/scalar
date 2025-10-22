import { createSynchronousResponse } from '@/helpers/create-synchronous-response'
import type { SynchronousResponse } from '@/types'

export const mockSynchronousResponse = (body?: string): Promise<SynchronousResponse> => {
  return createSynchronousResponse(
    new Response(body ?? '', {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
    }),
  )
}
