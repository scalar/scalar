import type { ApiError, ApiResponse } from './types'

/** Create a standardized API return object */
export function formatApiResponse<T>(data: T, status: number): ApiResponse<T> {
  return {
    status,
    data,
    error: false,
  }
}

/** Create a standardized API Error object */
export function formatApiError(message: string, status: number, error: any = null): ApiError {
  return {
    status,
    message,
    error: true,
    originalError: error,
  }
}
