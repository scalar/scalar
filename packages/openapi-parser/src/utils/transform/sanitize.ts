import type { OpenAPI } from '@scalar/openapi-types'

import type { AnyObject } from '@/types/index'
import { addInfoObject } from './utils/addInfoObject'
import { addLatestOpenApiVersion } from './utils/addLatestOpenApiVersion'
import { addMissingTags } from './utils/addMissingTags'
import { normalizeSecuritySchemes } from './utils/normalizeSecuritySchemes'
import { rejectSwaggerDocuments } from './utils/rejectSwaggerDocuments'

export { DEFAULT_OPENAPI_VERSION } from './utils/addLatestOpenApiVersion'
export { DEFAULT_TITLE, DEFAULT_VERSION } from './utils/addInfoObject'

/**
 * Make an OpenAPI document a valid and clean OpenAPI document
 *
 * @deprecated We're about to drop this from the package.
 */
export function sanitize(definition: AnyObject): OpenAPI.Document {
  const transformers = [
    rejectSwaggerDocuments,
    addLatestOpenApiVersion,
    addInfoObject,
    addMissingTags,
    normalizeSecuritySchemes,
  ]

  return transformers.reduce((doc, transformer) => transformer(doc), definition)
}
