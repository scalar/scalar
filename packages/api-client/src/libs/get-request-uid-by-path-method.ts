import type { OpenClientPayload } from '@/libs/create-client'
import { findRequestByPathMethod } from '@/libs/find-request'
import type { Operation } from '@scalar/oas-utils/entities/spec'

/**
 * Get the request uid by path and method
 */
export const getRequestUidByPathMethod = (
  requests: Record<string, Operation>,
  payload?: Omit<OpenClientPayload, '_source'>,
) => {
  const { requestUid, method, path } = payload ?? {}

  // If requestUid is provided, return it directly
  if (requestUid) {
    return requestUid
  }

  // In case theres no path or method provided, return the first
  if (!path || !method) {
    return Object.keys(requests)[0]
  }

  // Convert requests record to array for findRequestByPathMethod
  const requestsArray = Object.values(requests)

  // First try to find exact match (prioritize exact paths over pattern matches)
  const exactMatch = requestsArray.find(
    (item) => item.path.toLowerCase() === path.toLowerCase() && item.method.toLowerCase() === method.toLowerCase(),
  )

  if (exactMatch) {
    return exactMatch.uid
  }

  // If no exact match, use pattern matching logic for path parameters
  const { request } = findRequestByPathMethod(path, method, requestsArray)

  return request?.uid || Object.keys(requests)[0]
}
