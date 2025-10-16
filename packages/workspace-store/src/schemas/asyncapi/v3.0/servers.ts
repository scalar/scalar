import { Type } from '@scalar/typebox'

import { type ReferenceType, reference } from '@/schemas/v3.1/strict/reference'

import { ServerRef } from './ref-definitions'
import type { Server } from './server'

/**
 * An object to hold a map of Server Objects. This map can be referenced by name.
 */
export const ServersObjectSchemaDefinition = Type.Record(Type.String(), Type.Union([ServerRef, reference(ServerRef)]))

/**
 * An object to hold a map of Server Objects. This map can be referenced by name.
 */
export type ServersObject = Record<string, ReferenceType<Server>>
