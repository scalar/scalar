/** Matches an HTTP(S) URL against explicitly configured origins. */
export const isTrustedLocalOrigin = (url: URL, origins?: readonly string[]): boolean =>
  (url.protocol === 'http:' || url.protocol === 'https:') &&
  (origins?.some((value) => {
    if (typeof value !== 'string' || !/^https?:\/\/[^/?#@\\\s]+\/?$/i.test(value.trim())) {
      return false
    }
    try {
      return new URL(value).origin === url.origin
    } catch {
      return false
    }
  }) ??
    false)
