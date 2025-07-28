import { createSynchronousResponse } from '@/helpers/create-synchronous-response'
import type { SynchronousResponse } from '@/types.ts'

export const mockSynchronousResponse = async (body?: string): Promise<SynchronousResponse> => {
  return createSynchronousResponse(
    new Response(body ?? '', {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
    }),
  )
}
