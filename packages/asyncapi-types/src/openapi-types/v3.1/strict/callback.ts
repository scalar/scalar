import { Type } from '@scalar/typebox'

import type { PathItemObject } from './path-item'
import { PathItemObjectRef } from './ref-definitions'
import { type ReferenceType, reference } from './reference'

export const CallbackObjectSchemaDefinition = Type.Record(
  Type.String(),
  /** A Path Item Object used to define a callback request and expected responses. A complete example is available. */
  Type.Union([PathItemObjectRef, reference(PathItemObjectRef)]),
)

/** A Path Item Object used to define a callback request and expected responses. A complete example is available. */
export type CallbackObject = Record<string, ReferenceType<PathItemObject>>
