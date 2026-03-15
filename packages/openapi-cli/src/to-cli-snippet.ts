import type { OpenAPI } from '@scalar/openapi-types'

import { traverseSpec } from './traverse-spec.js'

export type ToCliSnippetOptions = {
  /** CLI binary name (e.g. openapi-cli or myapi) */
  cliName?: string
  /** Path to spec (for -s/--spec). Omit if not needed in snippet. */
  specPath?: string
  /** HTTP method */
  method: string
  /** Path (e.g. /planets) */
  path: string
  /** Path parameters to substitute */
  pathParams?: Record<string, string>
  /** Query parameters */
  query?: Record<string, string>
  /** Request body (object or string) */
  body?: unknown
  /** Prefer resource+action form when spec is provided and operation is found */
  spec?: OpenAPI.Document
}

/**
 * Produce a copy-paste runnable CLI command for an operation.
 * Prefers resource+action form (e.g. myapi planets getAllData --limit=10) when spec is provided;
 * otherwise uses verb+path form (e.g. myapi get /planets --query limit=10).
 */
export function toCliSnippet(options: ToCliSnippetOptions): string {
  const {
    cliName = 'openapi-cli',
    specPath = '<spec>',
    method,
    path,
    pathParams = {},
    query = {},
    body,
    spec,
  } = options

  const specPart = `-s ${specPath}`

  if (spec) {
    const operations = traverseSpec(spec)
    const op = operations.find((o) => o.path === path && o.method.toLowerCase() === method.toLowerCase())
    if (op && op.resource && op.action) {
      const parts = [cliName, specPart]
      if (op.prefixSegments.length > 0) {
        parts.push(...op.prefixSegments)
      }
      parts.push(op.resource, op.action)
      for (const p of op.pathParams) {
        const name = p.name.replace(/([A-Z])/g, '-$1').toLowerCase()
        const v = pathParams[p.name]
        if (v != null) parts.push(`--${name}=${shellEscape(v)}`)
      }
      for (const [k, v] of Object.entries(query)) {
        const key = k.replace(/([A-Z])/g, '-$1').toLowerCase()
        parts.push(`--${key}=${shellEscape(String(v))}`)
      }
      if (body !== undefined && body !== null && method !== 'GET') {
        const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
        parts.push(`-d ${shellEscape(bodyStr)}`)
      }
      return parts.join(' ')
    }
  }

  const parts = [cliName, specPart, method.toLowerCase(), path]
  for (const [k, v] of Object.entries(query)) {
    parts.push(`-q ${k}=${shellEscape(String(v))}`)
  }
  if (body !== undefined && body !== null && method !== 'GET') {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
    parts.push(`-d ${shellEscape(bodyStr)}`)
  }
  return parts.join(' ')
}

function shellEscape(value: string): string {
  if (/^[a-zA-Z0-9_-]+$/.test(value)) return value
  return `'${value.replace(/'/g, "'\\''")}'`
}
