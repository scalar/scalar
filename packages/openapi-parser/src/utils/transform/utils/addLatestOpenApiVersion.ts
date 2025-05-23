import type { AnyObject } from '@/types/index'

export const DEFAULT_OPENAPI_VERSION = '3.1.1'

export const addLatestOpenApiVersion = (definition: AnyObject) => ({
  openapi: definition.openapi ?? DEFAULT_OPENAPI_VERSION,
  ...definition,
})
