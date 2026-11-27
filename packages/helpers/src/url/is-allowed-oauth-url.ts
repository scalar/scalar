import { isLocalUrl } from '@/url/is-local-url'
import { isTrustedLocalOrigin } from '@/url/is-trusted-local-origin'

/** Allows HTTPS, with HTTP reserved for built-in or explicitly configured local origins. */
export const isAllowedOAuthUrl = (url: URL, trustedLocalOrigins?: readonly string[]): boolean =>
  url.protocol === 'https:' ||
  (url.protocol === 'http:' &&
    (isLocalUrl(url.href) || (!url.username && !url.password && isTrustedLocalOrigin(url, trustedLocalOrigins))))
