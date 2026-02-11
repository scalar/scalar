import type { ReferenceType } from '@/openapi-types/v3.1/strict/reference'
import type { TagObject } from '@/openapi-types/v3.1/strict/tag'

/**
 * Tags Object - A map of Tag Objects.
 * The keys are tag names and the values are Tag Objects or references to them.
 */
export type TagsObject = Record<string, ReferenceType<TagObject>>
