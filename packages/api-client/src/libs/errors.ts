/** Normalizes caught error into an error instance */
export const normalizeError = (
  e: unknown,
  defaultMessage: string = ERRORS.DEFAULT,
) => {
  if (e instanceof Error) return prettyError(e.message) ?? e
  if (typeof e === 'string') return prettyError(e) ?? new Error(e)

  return new Error(defaultMessage)
}

/**
 * Go like error handling
 */
export type ErrorResponse<ResponseType> = [Error, null] | [null, ResponseType]

/** Centralized list of all error messages */
export const ERRORS = {
  DEFAULT: 'An unknown error has occurred.',
  INVALID_URL: 'The URL seems to be invalid. Try adding a valid URL.',
  MISSING_FILE:
    'File uploads are not saved in history, you must re-upload the file.',
  REQUEST_ABORTED: 'The request has been cancelled',
  REQUEST_FAILED: 'An error occurred while making the request',
  URL_EMPTY: 'The adress bar seems to be empty. Try adding an URL.',
} as const

/** Takes javascript errors and returns a prettier message */
export const prettyError = (message: string) => {
  // Missing file
  if (
    message ===
    `Failed to execute 'append' on 'FormData': parameter 2 is not of type 'Blob'.`
  )
    return new Error(ERRORS.MISSING_FILE)

  // Invalid URL
  if (message === `Failed to construct 'URL': Invalid URL`)
    return new Error(ERRORS.INVALID_URL)

  return null
}
