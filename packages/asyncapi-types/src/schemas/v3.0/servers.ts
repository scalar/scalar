import { Type } from '@scalar/typebox'

import { reference } from '@/openapi-types/v3.1/strict/reference'

import { ServerObjectRef } from './ref-definitions'

/**
 * An object to hold a map of Server Objects. This map can be referenced by name.
 */
export const ServersObjectSchemaDefinition = Type.Record(
  Type.String(),
  Type.Union([ServerObjectRef, reference(ServerObjectRef)]),
)
