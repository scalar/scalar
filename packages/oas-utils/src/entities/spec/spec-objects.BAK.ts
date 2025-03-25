import { type ENTITY_BRANDS, nanoidSchema } from '@/entities/shared/utility'
import {
  ContactObjectSchema,
  ExternalDocumentationObjectSchema,
  InfoObjectSchema,
  LicenseObjectSchema,
  TagObjectSchema,
} from '@scalar/openapi-types/schemas/3.1'
import { z } from 'zod'

/**
 * Removes undefined values from an object.
 *
 * Can be used as a transform function for any Zod schema.
 */
export const omitUndefinedValues = <T extends object>(data: T): T => {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return [key, omitUndefinedValues(value)]
        }
        return [key, value]
      }),
  ) as T
}

export const oasLicenseSchema = LicenseObjectSchema.transform(omitUndefinedValues)

export const oasContactSchema = ContactObjectSchema.transform(omitUndefinedValues)

export const oasInfoSchema = InfoObjectSchema.transform(omitUndefinedValues)

export const oasExternalDocumentationSchema = ExternalDocumentationObjectSchema.transform(omitUndefinedValues)

export type ExternalDocumentation = z.infer<typeof oasExternalDocumentationSchema>

export const xScalarNestedSchema = z
  .object({
    tagName: z.string(),
  })
  .array()

export const oasTagSchema = TagObjectSchema.extend({
  // TODO: Remove
  /**
   * @deprecated Needs to be remove as it is not a spec property
   */
  'type': z.literal('tag').optional().default('tag'),
  'x-scalar-children': xScalarNestedSchema.default([]).optional(),
  /** Hide collections */
  'x-internal': z.boolean().optional(),
  'x-scalar-ignore': z.boolean().optional(),
})

export const tagSchema = oasTagSchema.extend({
  uid: nanoidSchema.brand<ENTITY_BRANDS['TAG']>(),
  children: z
    .union([z.string().brand<ENTITY_BRANDS['OPERATION']>(), z.string().brand<ENTITY_BRANDS['TAG']>()])
    .array()
    .default([]),
})

export type Tag = z.infer<typeof tagSchema>
export type TagPayload = z.input<typeof tagSchema>
