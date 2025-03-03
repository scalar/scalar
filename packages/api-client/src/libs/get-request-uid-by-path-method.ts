import type { OpenClientPayload } from '@/libs/create-client'
import type { Operation } from '@scalar/oas-utils/entities/spec'

/**
 * Get the request uid by path and method
 */
export const getRequestUidByPathMethod = (
  requests: Record<string, Operation>,
  payload?: Omit<OpenClientPayload, '_source'>,
) => {
  const { requestUid, method, path } = payload ?? {}

  // Find the request from path + method
  const resolvedRequestUid =
    requestUid ||
    Object.values(requests).find(
      (item) => item.path.toLowerCase() === path?.toLowerCase() && item.method.toLowerCase() === method?.toLowerCase(),
    )?.uid

  return resolvedRequestUid || Object.keys(requests)[0]
}
