import type { Plugin } from '@scalar/types/snippetz'

import { normalizeMethod, reduceQueryParams } from '@/libs/http'

/**
 * Escapes a string so it stays a valid EDN string literal. Backslashes are
 * escaped first, then double quotes, so the two passes do not interfere.
 */
const escapeEdnString = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

/**
 * A Clojure keyword (e.g. `:json`) rendered verbatim in EDN.
 */
class Keyword {
  constructor(public readonly name: string) {}
  toString(): string {
    return `:${this.name}`
  }
}

/**
 * A reference to a file on disk, rendered as a `clojure.java.io/file` call.
 */
class File {
  constructor(public readonly path: string) {}
  toString(): string {
    return `(clojure.java.io/file "${escapeEdnString(this.path)}")`
  }
}

/** True when the value is a plain object with no own keys. */
const isEmptyObject = (input: unknown): boolean =>
  typeof input === 'object' &&
  input !== null &&
  !Array.isArray(input) &&
  !(input instanceof Keyword) &&
  !(input instanceof File) &&
  Object.keys(input).length === 0

/**
 * Drops keys whose values are empty objects so we do not emit things like
 * `:headers {}` for a request without headers.
 */
const filterEmpty = (input: Record<string, unknown>): Record<string, unknown> => {
  for (const key of Object.keys(input)) {
    if (isEmptyObject(input[key])) {
      delete input[key]
    }
  }
  return input
}

/** Indents every line after the first by `padSize` spaces. */
const padBlock = (padSize: number, input: string): string => input.replace(/\n/g, `\n${' '.repeat(padSize)}`)

/**
 * Renders a JavaScript value as an EDN literal, matching clj-http conventions:
 * maps are laid out vertically and vectors horizontally.
 */
const jsToEdn = (value: unknown): string => {
  if (value === null) {
    return 'nil'
  }
  if (value instanceof Keyword || value instanceof File) {
    return value.toString()
  }
  if (typeof value === 'string') {
    return `"${escapeEdnString(value)}"`
  }
  if (Array.isArray(value)) {
    // Simple horizontal format.
    const body = value.reduce((accumulator: string, item) => `${accumulator} ${jsToEdn(item)}`, '').trim()
    return `[${padBlock(1, body)}]`
  }
  if (typeof value === 'object') {
    // Simple vertical format, one key per line.
    const body = Object.keys(value as Record<string, unknown>)
      .reduce((accumulator, key) => {
        const rendered = padBlock(key.length + 2, jsToEdn((value as Record<string, unknown>)[key]))
        return `${accumulator}:${key} ${rendered}\n `
      }, '')
      .trim()
    return `{${padBlock(1, body)}}`
  }
  // number, boolean
  return String(value)
}

/** Case-insensitive lookup of a header name as it was originally cased. */
const findHeaderName = (headers: Record<string, unknown>, name: string): string | undefined =>
  Object.keys(headers).find((header) => header.toLowerCase() === name.toLowerCase())

/** Removes a header (case-insensitive) from the headers map, if present. */
const deleteHeader = (headers: Record<string, unknown>, name: string): void => {
  const header = findHeaderName(headers, name)
  if (header) {
    delete headers[header]
  }
}

const SUPPORTED_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']

/**
 * clojure/clj_http
 */
export const clojureCljhttp: Plugin = {
  target: 'clojure',
  client: 'clj_http',
  title: 'clj-http',
  generate(request, configuration) {
    const method = normalizeMethod(request?.method).toLowerCase()

    if (!SUPPORTED_METHODS.includes(method)) {
      return 'Method not supported'
    }

    // Parse the URL so we can lift any query string into `:query-params`.
    const urlObject = new URL(request?.url ?? '')
    let url = urlObject.pathname === '/' ? urlObject.origin : urlObject.toString()

    // Collect query parameters from both the URL and the explicit list.
    const queryObj = reduceQueryParams([
      ...Array.from(urlObject.searchParams.entries()).map(([name, value]) => ({ name, value })),
      ...(request?.queryString ?? []),
    ])

    if (Object.keys(queryObj).length > 0) {
      // clj-http takes care of encoding the query string for us.
      url = url.split('?')[0] ?? url
    }

    // Reduce headers into a plain object (last value wins for duplicates).
    const headers = (request?.headers ?? []).reduce(
      (accumulator, header) => {
        accumulator[header.name] = header.value ?? ''
        return accumulator
      },
      {} as Record<string, unknown>,
    )

    // clj-http has no dedicated cookie option, so fold cookies into a single
    // Cookie header, mirroring what the request would send on the wire.
    if (request?.cookies?.length) {
      headers.Cookie = request.cookies
        .map((cookie) => `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`)
        .join('; ')
    }

    const params: Record<string, unknown> = {
      'headers': headers,
      'query-params': queryObj,
    }

    // Basic authentication maps to clj-http's `:basic-auth ["user" "pass"]`.
    if (configuration?.auth?.username && configuration?.auth?.password) {
      params['basic-auth'] = [configuration.auth.username, configuration.auth.password]
    }

    const postData = request?.postData
    switch (postData?.mimeType) {
      case 'application/json': {
        params['content-type'] = new Keyword('json')
        if (postData.text) {
          try {
            params['form-params'] = JSON.parse(postData.text)
          } catch {
            // Leave the body off when the payload is not valid JSON.
          }
        }
        deleteHeader(headers, 'content-type')
        break
      }
      case 'application/x-www-form-urlencoded': {
        params['form-params'] = (postData.params ?? []).reduce(
          (accumulator, param) => {
            if (param.name && param.value !== undefined) {
              accumulator[param.name] = param.value
            }
            return accumulator
          },
          {} as Record<string, string>,
        )
        deleteHeader(headers, 'content-type')
        break
      }
      case 'multipart/form-data': {
        if (postData.params) {
          params.multipart = postData.params.map((param) =>
            param.fileName !== undefined
              ? { name: param.name, content: new File(param.fileName) }
              : { name: param.name, content: param.value },
          )
        }
        deleteHeader(headers, 'content-type')
        break
      }
      default: {
        // Everything else (text/plain, octet-stream, …) goes through as a raw body.
        if (postData?.text) {
          params.body = postData.text
          deleteHeader(headers, 'content-type')
        }
      }
    }

    // clj-http exposes `:accept :json` instead of an Accept header for JSON.
    const acceptHeader = findHeaderName(headers, 'accept')
    if (acceptHeader && headers[acceptHeader] === 'application/json') {
      params.accept = new Keyword('json')
      delete headers[acceptHeader]
    }

    const filteredParams = filterEmpty(params)
    const require = "(require '[clj-http.client :as client])\n"

    if (isEmptyObject(filteredParams)) {
      return `${require}\n(client/${method} "${url}")`
    }

    // Align the option map under the opening of the call.
    const padding = 11 + method.length + url.length
    const formattedParams = padBlock(padding, jsToEdn(filteredParams))
    return `${require}\n(client/${method} "${url}" ${formattedParams})`
  },
}
