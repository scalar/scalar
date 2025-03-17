/** Centralized list of all error messages */
export const ERRORS = {
  DEFAULT: 'An unknown error has occurred.',
  INVALID_URL: 'The URL seems to be invalid. Try adding a valid URL.',
  INVALID_HEADER: 'There is an invalid header present, please double check your params.',
  MISSING_FILE: 'File uploads are not saved in history, you must re-upload the file.',
  REQUEST_ABORTED: 'The request has been cancelled',
  REQUEST_FAILED: 'An error occurred while making the request',
  URL_EMPTY: 'The address bar input seems to be empty. Try adding a URL.',
} as const

/** Normalizes caught error into an error instance */
export const normalizeError = (e: unknown, defaultMessage: string = ERRORS.DEFAULT): Error => {
  console.error(e)

  // If we have an error, update the message but keep the rest
  if (e instanceof Error) {
    e.message = prettyErrorMessage(e.message)
    return e
  }
  // If we have a string, return an error
  if (typeof e === 'string') {
    return new Error(prettyErrorMessage(e))
  }

  return new Error(defaultMessage)
}

/**
 * Go like error handling
 *
 * Ensure we return an error or response in an array
 */
export type ErrorResponse<ResponseType> = [Error, null] | [null, ResponseType]

/** Takes javascript errors and returns a prettier message */
export const prettyErrorMessage = (message: string) => {
  // Missing file
  if (message === `Failed to execute 'append' on 'FormData': parameter 2 is not of type 'Blob'.`) {
    return ERRORS.MISSING_FILE
  }

  // Invalid URL
  if (message === `Failed to construct 'URL': Invalid URL`) {
    return ERRORS.INVALID_URL
  }

  // Invalid Header
  if (message === `Failed to execute 'fetch' on 'Window': Invalid name`) {
    return ERRORS.INVALID_HEADER
  }

  return message
}
