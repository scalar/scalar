import type { OpenAPI } from '@scalar/openapi-types'

import type { AnyObject } from '../../types/index.ts'
import { addInfoObject } from './utils/addInfoObject.ts'
import { addLatestOpenApiVersion } from './utils/addLatestOpenApiVersion.ts'
import { addMissingTags } from './utils/addMissingTags.ts'
import { normalizeSecuritySchemes } from './utils/normalizeSecuritySchemes.ts'
import { rejectSwaggerDocuments } from './utils/rejectSwaggerDocuments.ts'

export { DEFAULT_OPENAPI_VERSION } from './utils/addLatestOpenApiVersion.ts'
export { DEFAULT_TITLE, DEFAULT_VERSION } from './utils/addInfoObject.ts'

/**
 * Make an OpenAPI document a valid and clean OpenAPI document
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
