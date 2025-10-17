import { Type } from '@scalar/typebox'

import { TagObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import { type ReferenceType, reference } from '@/schemas/v3.1/strict/reference'
import type { TagObject } from '@/schemas/v3.1/strict/tag'

/**
 * Tags Object - A map of Tag Objects.
 * The keys are tag names and the values are Tag Objects or references to them.
 */
export const TagsObjectSchemaDefinition = Type.Record(
  Type.String(),
  Type.Union([TagObjectRef, reference(TagObjectRef)]),
)

/**
 * Tags Object - A map of Tag Objects.
 * The keys are tag names and the values are Tag Objects or references to them.
 */
export type TagsObject = Record<string, ReferenceType<TagObject>>
