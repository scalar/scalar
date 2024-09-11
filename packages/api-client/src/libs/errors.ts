/** Normalizes caught error into an error instance */
export const normalizeError = (
  e: unknown,
  defaultMessage = 'An unknown error has occurred',
) => {
  if (e instanceof Error) return e
  else if (typeof e === 'string') return new Error(e)
  else return new Error(defaultMessage)
}

/**
 * Go like error handling
 */
export type ErrorResponse<ResponseType> = [Error, null] | [null, ResponseType]
