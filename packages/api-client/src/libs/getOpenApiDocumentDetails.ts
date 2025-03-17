import { json, yaml } from '@scalar/oas-utils/helpers'

import { isUrl } from './isUrl'

export type OpenApiDocumentDetails = {
  version: string
  type: 'json' | 'yaml'
  title: string | undefined
}

/** Try to extract details from the info */
function tryGetInfo(info: any) {
  return {
    title: typeof info?.title === 'string' ? `${info?.title}` : undefined,
  }
}

/**
 * Get the base Swagger/OpenAPI details from the given string
 */
export function getOpenApiDocumentDetails(input: string | null): OpenApiDocumentDetails | undefined {
  if (!input || isUrl(input)) {
    return undefined
  }

  try {
    const result = json.parse(input ?? '')

    if (typeof result?.openapi === 'string') {
      return {
        version: `OpenAPI ${result.openapi}`,
        type: 'json',
        ...tryGetInfo(result.info),
      }
    }

    if (typeof result?.swagger === 'string') {
      return {
        version: `Swagger ${result.swagger}`,
        type: 'json',
        ...tryGetInfo(result.info),
      }
    }

    return undefined
  } catch {
    //
  }

  try {
    const result = yaml.parse(input ?? '')

    if (typeof result?.openapi === 'string') {
      return {
        version: `OpenAPI ${result.openapi}`,
        type: 'yaml',
        ...tryGetInfo(result.info),
      }
    }

    if (typeof result?.swagger === 'string') {
      return {
        version: `Swagger ${result.swagger}`,
        type: 'yaml',
        ...tryGetInfo(result.info),
      }
    }

    return undefined
  } catch {
    //
  }

  return undefined
}
