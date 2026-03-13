/** Centralized list of all error messages */
export declare const ERRORS: {
  readonly BUILDING_REQUEST_FAILED: 'An error occurred while building the request'
  readonly DEFAULT: 'An unknown error has occurred.'
  readonly INVALID_URL: 'The URL seems to be invalid. Try adding a valid URL.'
  readonly INVALID_HEADER: 'There is an invalid header present, please double check your params.'
  readonly MISSING_FILE: 'File uploads are not saved in history, you must re-upload the file.'
  readonly REQUEST_ABORTED: 'The request has been cancelled'
  readonly REQUEST_FAILED: 'An error occurred while making the request'
  readonly URL_EMPTY: 'The address bar input seems to be empty. Try adding a URL.'
  readonly ON_BEFORE_REQUEST_FAILED: 'onBeforeRequest request hook failed'
}
/** Normalizes caught error into an error instance */
export declare const normalizeError: (e: unknown, defaultMessage?: string) => Error
/**
 * Go like error handling
 *
 * Ensure we return an error or response in an array
 */
export type ErrorResponse<ResponseType> = [Error, null] | [null, ResponseType]
/** Takes javascript errors and returns a prettier message */
export declare const prettyErrorMessage: (message: string) => string
//# sourceMappingURL=errors.d.ts.map
