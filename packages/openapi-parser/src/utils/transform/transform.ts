import type { OpenAPI } from '@scalar/openapi-types'

import type { AnyObject } from '../../types'
import { addInfoObject } from './utils/addInfoObject'
import { addLatestOpenApiVersion } from './utils/addLatestOpenApiVersion'
import { normalizeSecuritySchemes } from './utils/normalizeSecuritySchemes'
import { rejectSwaggerDocuments } from './utils/rejectSwaggerDocuments'

export { DEFAULT_OPENAPI_VERSION } from './utils/addLatestOpenApiVersion'
export { DEFAULT_TITLE, DEFAULT_VERSION } from './utils/addInfoObject'

/**
 * Make an OpenAPI document a valid and clean OpenAPI document
 */
export function transform(definition: AnyObject): OpenAPI.Document {
  const transformers = [
    rejectSwaggerDocuments,
    addLatestOpenApiVersion,
    addInfoObject,
    normalizeSecuritySchemes,
  ]

  return transformers.reduce((doc, transformer) => transformer(doc), definition)
}
