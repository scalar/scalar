import type { Header, HeaderList } from '@/types'

type RequestHeaders = HeaderList | string | null | undefined

/**
 * Looks up a header value case-insensitively. Returns the value of the first
 * non-disabled match, or undefined. Silently ignores string-typed headers
 * (Postman occasionally stores them that way).
 */
export function readHeader(headers: RequestHeaders, name: string): string | undefined {
  if (!headers || typeof headers === 'string' || !Array.isArray(headers)) {
    return undefined
  }
  const target = name.toLowerCase()
  const match = headers.find((h: Header) => h.key?.toLowerCase() === target && !h.disabled)
  return match?.value
}

/**
 * Normalises a raw Content-Type header value (`application/json; charset=utf-8`)
 * to just the media type (`application/json`). Returns undefined for empty input.
 */
export function parseMediaType(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }
  const trimmed = value.split(';')[0]?.trim().toLowerCase()
  return trimmed || undefined
}

/**
 * Picks a single media type from an Accept header value, preferring
 * `application/json` if present, else the first non-wildcard type. Returns
 * undefined for `*​/*` alone, empty input, or only wildcard types.
 */
export function pickAcceptMediaType(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }
  const types = value
    .split(',')
    .map((t) => parseMediaType(t))
    .filter((t): t is string => !!t && t !== '*/*')
  if (types.length === 0) {
    return undefined
  }
  return types.find((t) => t === 'application/json') ?? types[0]
}
