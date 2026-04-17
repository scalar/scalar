import { REGEX } from '@scalar/helpers/regex/regex-helpers'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { ParsedUrl } from '@/types'

const POSTMAN_TEMPLATE_REGEX = /\{\{([^{}]{0,1000})\}\}/g
const DEFAULT_SERVER_VARIABLE_VALUE = 'example.com'
const SERVER_VARIABLE_DESCRIPTION = 'Declared in Postman collection variables.'

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
  const finalPath = ('/' + path.replace(POSTMAN_TEMPLATE_REGEX, '{$1}').replace(/^\/+/, '')).replace(/\/\/+/g, '/')

  return finalPath
}

/**
 * Normalizes a path by converting colon-style parameters to curly brace style
 * e.g., '/users/:id' becomes '/users/{id}'
 */
export const normalizePath = (path: string): string => path.replace(/:(\w+)/g, '{$1}')

type CollectionVariableLookup = ReadonlyMap<string, string>

const isCompleteUrl = (value: string): boolean => /^(https?:\/\/)/i.test(value)

const hasPostmanTemplateSyntax = (value: string): boolean => /\{\{([^{}]{0,1000})\}\}/.test(value)

const createServerVariableDefinition = (): NonNullable<OpenAPIV3_1.ServerObject['variables']>[string] => ({
  default: DEFAULT_SERVER_VARIABLE_VALUE,
  description: SERVER_VARIABLE_DESCRIPTION,
})

/**
 * Extracts Postman collection variables into a lookup table.
 */
export function createCollectionVariableLookup(
  variables: ReadonlyArray<{ key?: string; value?: string | number | boolean; disabled?: boolean }> | undefined,
): ReadonlyMap<string, string> {
  const variableLookup = new Map<string, string>()
  for (const variable of variables ?? []) {
    const key = variable.key?.trim()
    if (!key || variable.disabled || variable.value === undefined) {
      continue
    }
    variableLookup.set(key, String(variable.value))
  }
  return variableLookup
}

/**
 * Generates a structural path signature by replacing parameter segments with `{*}`.
 * Paths with the same signature are equivalent except for parameter names.
 */
export const getPathStructuralSignature = (path: string): string => {
  const normalizedPath = normalizePath(path)

  if (normalizedPath === '') {
    return ''
  }

  const segments = normalizedPath.split('/')
  const signatureSegments = segments.map((segment) => (/^\{[^{}]+\}$/.test(segment) ? '{*}' : segment))

  return signatureSegments.join('/')
}

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
  return extractServerObjectFromUrl(url)?.url
}

/**
 * Extracts the server object from a request URL and resolves Postman templates.
 */
export function extractServerObjectFromUrl(
  url: string | undefined,
  collectionVariableLookup: CollectionVariableLookup = new Map(),
): OpenAPIV3_1.ServerObject | undefined {
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
    const rawServerUrl = protocol
      ? `${protocol}${hostPart}`.replace(/\/$/, '')
      : `https://${hostPart}`.replace(/\/$/, '')
    const templateMatches = Array.from(rawServerUrl.matchAll(POSTMAN_TEMPLATE_REGEX))
    if (templateMatches.length === 0) {
      return { url: rawServerUrl }
    }

    const unresolvedVariables = new Set<string>()
    const fullHostTemplateMatch = rawServerUrl.match(/^https?:\/\/\{\{\s*([^{}]{0,1000})\s*\}\}$/i)
    if (fullHostTemplateMatch?.[1]) {
      const variableName = fullHostTemplateMatch[1].trim()
      const variableValue = collectionVariableLookup.get(variableName)
      if (!variableValue || hasPostmanTemplateSyntax(variableValue)) {
        unresolvedVariables.add(variableName)
      } else if (isCompleteUrl(variableValue)) {
        return { url: variableValue.replace(/\/$/, '') }
      }
    }

    const resolvedUrl = rawServerUrl.replace(POSTMAN_TEMPLATE_REGEX, (_, rawName: string) => {
      const variableName = rawName.trim()
      const variableValue = collectionVariableLookup.get(variableName)
      if (!variableValue || hasPostmanTemplateSyntax(variableValue)) {
        unresolvedVariables.add(variableName)
        return `{${variableName}}`
      }

      if (isCompleteUrl(variableValue)) {
        unresolvedVariables.add(variableName)
        return `{${variableName}}`
      }

      return variableValue
    })

    if (unresolvedVariables.size > 0) {
      const variables: NonNullable<OpenAPIV3_1.ServerObject['variables']> = {}
      for (const variableName of unresolvedVariables) {
        variables[variableName] = createServerVariableDefinition()
      }
      return {
        url: resolvedUrl,
        variables,
      }
    }

    return { url: resolvedUrl.replace(/\/$/, '') }
  } catch (error) {
    console.error(`Error extracting server from URL "${url}":`, error)
    return undefined
  }
}
