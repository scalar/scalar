import { type ENTITY_BRANDS, nanoidSchema } from '@/entities/shared/utility'
import { z } from 'zod'

/**
 * License Object
 *
 * License information for the exposed API.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#license-object
 */
export const oasLicenseSchema = z
  .object({
    /** REQUIRED. The license name used for the API. */
    name: z.string().optional().catch(undefined),
    /** An SPDX license expression for the API. The identifier field is mutually exclusive of the url field. */
    identifier: z.string().optional().catch(undefined),
    /**
     * A URI for the license used for the API. This MUST be in the form of a URI. The url field is mutually exclusive of the identifier field.
     */
    url: z.string().url().optional().catch(undefined),
  })
  .transform((data) => {
    // Remove undefined values
    return Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== undefined))
  })

/**
 * Contact Object
 *
 * Contact information for the exposed API.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#contact-object
 */
export const oasContactSchema = z
  .object({
    /** The identifying name of the contact person/organization. */
    name: z.string().optional(),
    /** The URL pointing to the contact information. This MUST be in the form of a URL. */
    url: z.string().url().optional().catch(undefined),
    /** The email address of the contact person/organization. This MUST be in the form of an email address. */
    email: z.string().email().optional().catch(undefined),
  })
  .transform((data) => {
    // Remove undefined values
    return Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== undefined))
  })

/**
 * Info
 * The object provides metadata about the API. The metadata MAY be used by the clients if needed,
 * and MAY be presented in editing or documentation generation tools for convenience.
 *
 * @see https://spec.openapis.org/oas/latest.html#info-object
 */
export const oasInfoSchema = z
  .object({
    /** REQUIRED. The title of the API. */
    title: z.string().catch('API'),
    /** A short summary of the API. */
    summary: z.string().optional(),
    /** A description of the API. CommonMark syntax MAY be used for rich text representation. */
    description: z.string().optional(),
    /** A URL to the Terms of Service for the API. This MUST be in the form of a URL. */
    termsOfService: z.string().optional(),
    /** The contact information for the exposed API. */
    contact: oasContactSchema.optional().catch(undefined),
    /** The license information for the exposed API. */
    license: oasLicenseSchema.optional().catch(undefined),
    /**
     * REQUIRED. The version of the OpenAPI document (which is distinct from the OpenAPI
     * Specification version or the API implementation version).
     */
    version: z.string().catch('1.0'),
  })
  .transform((data) => {
    // Remove undefined values
    return Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== undefined))
  })

/**
 * External Documentation
 * Allows referencing an external resource for extended documentation.
 *
 * @see https://spec.openapis.org/oas/latest.html#external-documentation-object
 */
export const oasExternalDocumentationSchema = z.object({
  /** A description of the target documentation. CommonMark syntax MAY be used for rich text representation. */
  description: z.string().optional(),
  /** REQUIRED. The URL for the target documentation. This MUST be in the form of a URL. */
  url: z.string().default(''),
})
export type ExternalDocumentation = z.infer<typeof oasExternalDocumentationSchema>

export const xScalarNestedSchema = z
  .object({
    tagName: z.string(),
  })
  .array()

/**
 * Tag
 * Adds metadata to a single tag that is used by the Operation Object. It is not mandatory to have a Tag
 * Object per tag defined in the Operation Object instances.
 *
 * @see https://spec.openapis.org/oas/latest.html#tag-object
 */
export const oasTagSchema = z.object({
  /**
   * @deprecated
   *
   * Needs to be remove as it is not a spec property
   */
  'type': z.literal('tag').optional().default('tag'),
  /** REQUIRED. The name of the tag. */
  'name': z.string(),
  /** A description for the tag. CommonMark syntax MAY be used for rich text representation. */
  'description': z.string().optional(),
  /** Additional external documentation for this tag. */
  'externalDocs': oasExternalDocumentationSchema.optional(),
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
