import { REGEX } from '@scalar/helpers/regex/regex-helpers'

import type { ParsedUrl } from '@/types'

/**
 * Parses a URL string into its component parts.
 */
function parseUrl(urlString: string): ParsedUrl {
  const url = new URL(urlString)
  return {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
  }
}

/**
 * Extracts the domain (including protocol and port if present) from a given URL.
 */
export function getDomainFromUrl(url: string): string {
  const { protocol, hostname, port } = parseUrl(url)
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`
}

/**
 * Extracts the path from a given URL, removing any Postman variables.
 */
export function extractPathFromUrl(url: string | undefined): string {
  if (!url) {
    return '/'
  }

  // Remove scheme, domain, query parameters, and hash fragments
  const path = url.replace(/^(?:https?:\/\/)?[^/]+(\/|$)/, '/').split(/[?#]/)[0] ?? ''

  // Replace Postman variables and ensure single leading slash
  const finalPath = ('/' + path.replace(/\{\{([^{}]{0,1000})\}\}/g, '{$1}').replace(/^\/+/, '')).replace(/\/\/+/g, '/')

  return finalPath
}

/**
 * Normalizes a path by converting colon-style parameters to curly brace style
 * e.g., '/users/:id' becomes '/users/{id}'
 */
export const normalizePath = (path: string): string => path.replace(/:(\w+)/g, '{$1}')

/**
 * Extracts parameter names from a path string.
 * Handles double curly braces {{param}}, single curly braces {param}, and colon format :param.
 */
export function extractPathParameterNames(path: string): string[] {
  const params = new Set<string>()
  let match

  while ((match = REGEX.TEMPLATE_VARIABLE.exec(path)) !== null) {
    // match[1] contains the parameter name from {{param}}
    // match[2] contains the parameter name from {param}
    // match[0].slice(1) gets the parameter name from :param
    const param = match[1] || match[2] || match[0].slice(1)
    params.add(param.trim())
  }

  return Array.from(params)
}

/**
 * Extracts the server URL from a request URL string.
 * Handles URLs with or without protocol, with ports, etc.
 * Returns undefined if no valid server URL can be extracted.
 */
export function extractServerFromUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined
  }

  try {
    // Check if URL has a protocol
    const protocolMatch = url.match(/^(https?:\/\/)/i)
    const protocol = protocolMatch ? protocolMatch[1] : null

    // Extract domain from URL
    const urlMatch = url.match(/^(?:https?:\/\/)?([^/?#]+)/i)
    if (!urlMatch?.[1]) {
      return undefined
    }

    const hostPart = urlMatch[1]
    // Preserve the original protocol if present, otherwise default to https
    const serverUrl = protocol ? `${protocol}${hostPart}`.replace(/\/$/, '') : `https://${hostPart}`.replace(/\/$/, '')

    return serverUrl
  } catch (error) {
    console.error(`Error extracting server from URL "${url}":`, error)
    return undefined
  }
}
