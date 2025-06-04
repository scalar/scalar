import { REGEX } from '@/regex/regex-helpers'

/** Ensure URL has a protocol prefix */
export function ensureProtocol(url: string): string {
  if (REGEX.PROTOCOL.test(url)) {
    return url
  }

  // Default to http if no protocol is specified
  return `http://${url.replace(/^\//, '')}`
}
