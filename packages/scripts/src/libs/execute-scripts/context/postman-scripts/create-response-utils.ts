import { createSynchronousResponse } from '@/helpers/create-synchronous-response'
import type { SynchronousResponse } from '@/types'
import { type ResponseAssertions, createResponseAssertions } from './create-response-assertions'

export type ExtendedSynchronousResponse = Omit<SynchronousResponse, 'headers'> & {
  // Alias (as seen in Postman)
  code: Response['status']
  headers: Record<string, string>
  to: ResponseAssertions
  responseTime: number
}

export const createExtendedSynchronousResponse = async (response: Response): Promise<ExtendedSynchronousResponse> => {
  const synchronousResponse = await createSynchronousResponse(response)

  return {
    ...synchronousResponse,
    headers: Object.fromEntries(response.headers.entries()),
    code: response.status,
    to: createResponseAssertions(synchronousResponse),
    get responseTime() {
      // TODO: Get actual response time
      return Number(performance.now().toFixed(2))
    },
  }
}
