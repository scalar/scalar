/** Percent-encodes everything outside the RFC 3986 unreserved set. */
export const encodeUriComponent = (value: string): string =>
  encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
