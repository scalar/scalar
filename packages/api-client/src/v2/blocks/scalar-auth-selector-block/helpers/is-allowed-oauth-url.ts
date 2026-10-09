import { isLocalUrl } from '@scalar/helpers/url/is-local-url'

/** Allows HTTPS, with HTTP reserved for local development hosts and reserved test domains. */
export const isAllowedOAuthUrl = (url: URL): boolean =>
  url.protocol === 'https:' || (url.protocol === 'http:' && isLocalUrl(url.href))
