import { type ENTITY_BRANDS, nanoidSchema } from '@/entities/shared/utility'
import { xScalarChildrenSchema } from '@/entities/specification/extensions/x-scalar-children'
import { ExternalDocumentationSchema } from '@/entities/specification/external-documentation-object'
import { z } from 'zod'

/**
 * Tag Object
 *
 * Adds metadata to a single tag that is used by the Operation Object. It is not mandatory to have a Tag Object per tag
 * defined in the Operation Object instances.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#tag-object
 */

export const TagObjectSchema = z.object({
  // TODO: Remove
  /**
   * @deprecated Needs to be removed as it is not a spec property
   */
  'type': z.literal('tag').optional().default('tag'),
  /** REQUIRED. The name of the tag. */
  'name': z.string(),
  /** A description for the tag. CommonMark syntax MAY be used for rich text representation. */
  'description': z.string().optional().catch(undefined),
  /** Additional external documentation for this tag. */
  'externalDocs': ExternalDocumentationSchema.optional(),
  'x-scalar-children': xScalarChildrenSchema.default([]).optional(),
  /** Hide collections */
  'x-internal': z.boolean().optional(),
  'x-scalar-ignore': z.boolean().optional(),
})

export type Tag = z.infer<typeof TagObjectSchema>
export type TagPayload = z.input<typeof TagObjectSchema>

export const ExtendedTagSchema = TagObjectSchema.extend({
  uid: nanoidSchema.brand<ENTITY_BRANDS['TAG']>(),
  children: z
    .union([z.string().brand<ENTITY_BRANDS['OPERATION']>(), z.string().brand<ENTITY_BRANDS['TAG']>()])
    .array()
    .default([]),
})

export type ExtendedTag = z.infer<typeof ExtendedTagSchema>
export type ExtendedTagPayload = z.input<typeof ExtendedTagSchema>
