import type { ParsedUrl } from '../types'
import { templateVariableRegex } from '@scalar/oas-utils/helpers'

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
  if (!url) return '/'

  // Remove scheme, domain, query parameters, and hash fragments
  const path = url.replace(/^(?:https?:\/\/)?[^/]+(\/|$)/, '/').split(/[?#]/)[0]

  // Replace Postman variables and ensure single leading slash
  const finalPath = (
    '/' + path.replace(/\{\{([^{}]{0,1000})\}\}/g, '{$1}').replace(/^\/+/, '')
  ).replace(/\/\/+/g, '/')

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
  const params = []
  let match

  while ((match = templateVariableRegex.exec(path)) !== null) {
    // match[1] is for double curly braces, match[2] is for single curly braces
    // if neither exists, it's a colon parameter
    const param = match[1] || match[2] || match[0].slice(1)
    params.push(param.trim())
  }

  return [...new Set(params)] // Deduplicate parameters
}
