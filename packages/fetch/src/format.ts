import type { APIError, APIResponse } from '@/types'

/** Create a standardized API return object */
export function formatApiResponse<T>(data: T, status: number): APIResponse<T> {
  return {
    status,
    data,
    error: false,
  }
}

/** Create a standardized API Error object */
export function formatApiError(
  message: string,
  status: number,
  error: any = null,
): APIError {
  return {
    status,
    message,
    error: true,
    originalError: error,
  }
}
