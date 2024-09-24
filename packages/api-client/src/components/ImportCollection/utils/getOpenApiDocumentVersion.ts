import { isDocument } from '@/components/ImportCollection/utils/isDocument'
import { parse } from 'yaml'

/**
 * Get the Swagger/OpenAPI version and format from the given string
 */
export function getOpenApiDocumentVersion(input: string | null) {
  if (!isDocument(input)) {
    return false
  }

  try {
    const result = JSON.parse(input ?? '')

    if (typeof result?.openapi === 'string') {
      return `OpenAPI ${result.openapi} JSON`
    }

    if (typeof result?.swagger === 'string') {
      return `Swagger ${result.swagger} JSON`
    }

    return false
  } catch {
    //
  }

  try {
    const result = parse(input ?? '')

    if (typeof result?.openapi === 'string') {
      return `OpenAPI ${result.openapi} YAML`
    }

    if (typeof result?.swagger === 'string') {
      return `Swagger ${result.swagger} YAML`
    }

    return false
  } catch {
    //
  }

  return false
}
