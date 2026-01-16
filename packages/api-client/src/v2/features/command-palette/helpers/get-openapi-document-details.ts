import { json, yaml } from '@scalar/oas-utils/helpers'

import { isUrl } from '@/v2/helpers/is-url'

/**
 * Represents parsed details from an OpenAPI or Swagger specification.
 * Used to display information about imported API descriptions in the command palette.
 */
type OpenApiDocumentDetails = {
  /** The API specification version (e.g., "OpenAPI 3.1.0" or "Swagger 2.0"). */
  version: string
  /** The format of the specification document. */
  type: 'json' | 'yaml'
  /** The API title extracted from the info object, if available. */
  title: string | undefined
}

/**
 * Represents the minimal structure of a parsed API description document.
 * Used for type safety when checking for OpenAPI or Swagger properties.
 */
type ParsedApiDocument = {
  openapi?: string
  swagger?: string
  info?: {
    title?: string
  }
}

/**
 * Extracts the title from the info object of an API description.
 * Returns undefined if the title is not a string or does not exist.
 */
const extractTitle = (info: ParsedApiDocument['info']): string | undefined => {
  return typeof info?.title === 'string' ? info.title : undefined
}

/**
 * Attempts to extract OpenAPI document details from a parsed document.
 * Checks for both OpenAPI and Swagger specifications.
 */
const parseDocumentDetails = (
  document: ParsedApiDocument,
  type: 'json' | 'yaml',
): OpenApiDocumentDetails | undefined => {
  if (typeof document.openapi === 'string') {
    return {
      version: `OpenAPI ${document.openapi}`,
      type,
      title: extractTitle(document.info),
    }
  }

  if (typeof document.swagger === 'string') {
    return {
      version: `Swagger ${document.swagger}`,
      type,
      title: extractTitle(document.info),
    }
  }

  return undefined
}

/**
 * Attempts to parse the input string with the given parser function.
 * Returns undefined if parsing fails.
 */
const tryParse = (
  input: string,
  parser: (input: string) => unknown,
  type: 'json' | 'yaml',
): OpenApiDocumentDetails | undefined => {
  try {
    const result = parser(input) as ParsedApiDocument
    return parseDocumentDetails(result, type)
  } catch {
    // Parsing failed, which is expected for invalid or non-matching formats
    return undefined
  }
}

/**
 * Extracts OpenAPI or Swagger specification details from a string.
 * Attempts to parse as JSON first, then YAML if JSON parsing fails.
 *
 * Returns undefined if:
 * - Input is null, empty, or a URL
 * - Input is not a valid JSON or YAML document
 * - Document does not contain OpenAPI or Swagger version information
 */
export const getOpenApiDocumentDetails = (input: string | null): OpenApiDocumentDetails | undefined => {
  if (!input || isUrl(input)) {
    return undefined
  }

  // Try parsing as JSON first
  const jsonResult = tryParse(input, json.parse, 'json')
  if (jsonResult) {
    return jsonResult
  }

  // Fall back to YAML parsing
  return tryParse(input, yaml.parse, 'yaml')
}
