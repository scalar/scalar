/**
 * RegExp to match cookie-name in RFC 6265 sec 4.1.1.
 *
 * Mirrors the `cookie` package so that names containing invalid characters are rejected.
 */
const cookieNameRegExp = /^[!-:<>-~]+$/

/**
 * RegExp to match cookie-value in RFC 6265 sec 4.1.1.
 */
const cookieValueRegExp = /^[!-:<-~]*$/

/** RegExp to match domain-value in RFC 6265 sec 4.1.1. */
const domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i

/** RegExp to match path-value in RFC 6265 sec 4.1.1. */
const pathValueRegExp = /^[ -:=-~]*$/

/** Options accepted when serializing a `Set-Cookie` header value. */
export type SerializeCookieOptions = {
  /** Number of seconds until the cookie expires, rendered as `Max-Age`. */
  maxAge?: number
  /** Domain the cookie is valid for, rendered as `Domain`. */
  domain?: string
  /** Path the cookie is valid for, rendered as `Path`. */
  path?: string
  /** Absolute expiry date, rendered as `Expires` using `Date.toUTCString()`. */
  expires?: Date
  /** Whether to add the `HttpOnly` attribute. */
  httpOnly?: boolean
  /** Whether to add the `Secure` attribute. */
  secure?: boolean
  /** Whether to add the `Partitioned` attribute. */
  partitioned?: boolean
  /** Cookie priority, rendered as `Priority=Low|Medium|High`. */
  priority?: 'low' | 'medium' | 'high' | (string & {})
  /**
   * The `SameSite` attribute.
   *
   * `true` is treated as `Strict`, otherwise `strict`, `lax`, or `none`.
   */
  sameSite?: boolean | 'lax' | 'strict' | 'none' | (string & {})
}

/**
 * Serialize a cookie name, value, and options into a `Set-Cookie` header string.
 *
 * This is a small, ESM-friendly drop-in for the `cookie` package's `serialize` (a.k.a.
 * `stringifySetCookie`) function. The third-party package is CommonJS-only, which breaks
 * Vite dev under pnpm's strict `node_modules` layout, so we reproduce just the behavior we
 * need here.
 *
 * The value is intentionally left raw (not URL-encoded) to match how it was previously
 * called with `encode: (str) => str`.
 */
export const serializeCookie = (name: string, value: string, options: SerializeCookieOptions = {}): string => {
  if (!cookieNameRegExp.test(name)) {
    throw new TypeError(`argument name is invalid: ${name}`)
  }

  if (!cookieValueRegExp.test(value)) {
    throw new TypeError(`argument val is invalid: ${value}`)
  }

  let str = `${name}=${value}`

  if (options.maxAge !== undefined) {
    if (!Number.isInteger(options.maxAge)) {
      throw new TypeError(`option maxAge is invalid: ${options.maxAge}`)
    }
    str += `; Max-Age=${options.maxAge}`
  }

  if (options.domain) {
    if (!domainValueRegExp.test(options.domain)) {
      throw new TypeError(`option domain is invalid: ${options.domain}`)
    }
    str += `; Domain=${options.domain}`
  }

  if (options.path) {
    if (!pathValueRegExp.test(options.path)) {
      throw new TypeError(`option path is invalid: ${options.path}`)
    }
    str += `; Path=${options.path}`
  }

  if (options.expires) {
    if (!(options.expires instanceof Date) || !Number.isFinite(options.expires.valueOf())) {
      throw new TypeError(`option expires is invalid: ${options.expires}`)
    }
    str += `; Expires=${options.expires.toUTCString()}`
  }

  if (options.httpOnly) {
    str += '; HttpOnly'
  }

  if (options.secure) {
    str += '; Secure'
  }

  if (options.partitioned) {
    str += '; Partitioned'
  }

  if (options.priority) {
    const priority = typeof options.priority === 'string' ? options.priority.toLowerCase() : undefined

    switch (priority) {
      case 'low':
        str += '; Priority=Low'
        break
      case 'medium':
        str += '; Priority=Medium'
        break
      case 'high':
        str += '; Priority=High'
        break
      default:
        throw new TypeError(`option priority is invalid: ${options.priority}`)
    }
  }

  if (options.sameSite) {
    const sameSite = typeof options.sameSite === 'string' ? options.sameSite.toLowerCase() : options.sameSite

    switch (sameSite) {
      case true:
      case 'strict':
        str += '; SameSite=Strict'
        break
      case 'lax':
        str += '; SameSite=Lax'
        break
      case 'none':
        str += '; SameSite=None'
        break
      default:
        throw new TypeError(`option sameSite is invalid: ${options.sameSite}`)
    }
  }

  return str
}
