import { Type } from '@scalar/typebox'

import { TagObjectRef } from '@/openapi-types/v3.1/strict/ref-definitions'
import { reference } from '@/openapi-types/v3.1/strict/reference'

/**
 * Tags Object - A map of Tag Objects.
 * The keys are tag names and the values are Tag Objects or references to them.
 */
export const TagsObjectSchemaDefinition = Type.Record(
  Type.String(),
  Type.Union([TagObjectRef, reference(TagObjectRef)]),
)
