import { REGEX } from '@/regex/regex-helpers'

/**
 * Check if the URL is relative or if it's a domain without protocol
 **/
export const isRelativePath = (url: string) => {
  // Allow http:// https:// and other protocols such as file://
  if (REGEX.PROTOCOL.test(url)) {
    return false
  }

  // Check if it looks like a domain (contains dots and no spaces)
  // This catches cases like "galaxy.scalar.com/planets"
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+(\/|$)/.test(url)) {
    return false
  }

  return true
}
