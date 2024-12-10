type Headers<T> = Record<string, T>
/**
 * Given a headers object retrieve a specific header out of it via a case-insensitive key.
 */
export declare const getHeaderName: <T>(
  headers: Headers<T>,
  name: string,
) => string | undefined
/**
 * Given a headers object retrieve the contents of a header out of it via a case-insensitive key.
 */
export declare const getHeader: <T>(
  headers: Headers<T>,
  name: string,
) => T | undefined
/**
 * Determine if a given case-insensitive header exists within a header object.
 */
export declare const hasHeader: <T>(
  headers: Headers<T>,
  name: string,
) => boolean
/**
 * Determines if a given mimetype is JSON, or a variant of such.
 */
export declare const isMimeTypeJSON: (
  mimeType: string,
) => mimeType is
  | `${string}application/json${string}`
  | `${string}application/x-json${string}`
  | `${string}text/json${string}`
  | `${string}text/x-json${string}`
  | `${string}+json${string}`
export {}
