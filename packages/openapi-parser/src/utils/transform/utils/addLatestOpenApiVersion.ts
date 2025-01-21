import type { AnyObject } from '../../../types/index.js'

export const DEFAULT_OPENAPI_VERSION = '3.1.1'

export const addLatestOpenApiVersion = (definition: AnyObject) => ({
  openapi: definition.openapi ?? DEFAULT_OPENAPI_VERSION,
  ...definition,
})
