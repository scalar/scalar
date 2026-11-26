import { HTTP_TOKEN } from '@scalar/helpers/http/http-token'

/** Reject fields that Fetch or the HTTP transport cannot represent, before writing the response. */
export const isSettableResponseHeader = (name: string, value: string): boolean => {
  // Compare the full match because a regexp's end anchor can precede a final newline.
  return HTTP_TOKEN.exec(name)?.[0] === name && !/[^\t\x20-\x7e\x80-\xff]/.test(value)
}
