import type { OpenAPI } from '@scalar/openapi-types'

import type { AnyObject } from '../../types/index.js'
import { addInfoObject } from './utils/addInfoObject.js'
import { addLatestOpenApiVersion } from './utils/addLatestOpenApiVersion.js'
import { addMissingTags } from './utils/addMissingTags.js'
import { normalizeSecuritySchemes } from './utils/normalizeSecuritySchemes.js'
import { rejectSwaggerDocuments } from './utils/rejectSwaggerDocuments.js'

export { DEFAULT_OPENAPI_VERSION } from './utils/addLatestOpenApiVersion.js'
export { DEFAULT_TITLE, DEFAULT_VERSION } from './utils/addInfoObject.js'

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
