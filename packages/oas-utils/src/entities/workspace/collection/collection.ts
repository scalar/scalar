import { nanoidSchema } from '@/entities/workspace/shared'
import { deepMerge } from '@/helpers'
import { z } from 'zod'

/**
 * License information for the exposed API.
 *
 * @see https://spec.openapis.org/oas/latest.html#license-object
 */
const licenseSchema = z.object({
  /** REQUIRED. The license name used for the API. */
  name: z.string().optional().default('name'),
  /** An SPDX license expression for the API. The identifier field is mutually exclusive of the url field. */
  identifier: z.string().optional(),
  /**
   * A URL to the license used for the API. This MUST be in the form of a URL. The url field
   * is mutually exclusive of the identifier field.
   */
  url: z.string().url().optional(),
})

/**
 * Contact
 * Contact information for the exposed API.
 *
 * @see https://spec.openapis.org/oas/latest.html#contact-object
 */
const contactSchema = z.object({
  /** The identifying name of the contact person/organization. */
  name: z.string().optional(),
  /** The URL pointing to the contact information. This MUST be in the form of a URL. */
  url: z.string().url().optional(),
  /** The email address of the contact person/organization. This MUST be in the form of an email address. */
  email: z.string().email().optional(),
})

/**
 * Info
 * The object provides metadata about the API. The metadata MAY be used by the clients if needed,
 * and MAY be presented in editing or documentation generation tools for convenience.
 *
 * @see https://spec.openapis.org/oas/latest.html#info-object
 */
const infoSchema = z.object({
  /** REQUIRED. The title of the API. */
  title: z.string().optional().default('default'),
  /** A short summary of the API. */
  summary: z.string().optional(),
  /** A description of the API. CommonMark syntax MAY be used for rich text representation. */
  description: z.string().optional(),
  /** A URL to the Terms of Service for the API. This MUST be in the form of a URL. */
  termsOfService: z.string().optional(),
  /** The contact information for the exposed API. */
  contact: contactSchema.optional(),
  /** The license information for the exposed API. */
  license: licenseSchema.optional(),
  /**
   * REQUIRED. The version of the OpenAPI document (which is distinct from the OpenAPI
   * Specification version or the API implementation version).
   */
  version: z.string().default('0.0.1'),
})

/**
 * External Documentation
 * Allows referencing an external resource for extended documentation.
 *
 * @see https://spec.openapis.org/oas/latest.html#external-documentation-object
 */
const exteralDocumentationSchema = z.object({
  /** A description of the target documentation. CommonMark syntax MAY be used for rich text representation. */
  description: z.string().optional(),
  /** REQUIRED. The URL for the target documentation. This MUST be in the form of a URL. */
  url: z.string().default(''),
})
export type ExternalDocumentation = z.infer<typeof exteralDocumentationSchema>

/**
 * Tag
 * Adds metadata to a single tag that is used by the Operation Object. It is not mandatory to have a Tag
 * Object per tag defined in the Operation Object instances.
 *
 * @see https://spec.openapis.org/oas/latest.html#tag-object
 */
const tagSchema = z.object({
  /** REQUIRED. The name of the tag. */
  name: z.string().optional().default('default'),
  /** A description for the tag. CommonMark syntax MAY be used for rich text representation. */
  description: z.string().optional(),
  /** Additional external documentation for this tag. */
  externalDocs: exteralDocumentationSchema.optional(),
})

const specSchema = z.object({
  openapi: z
    .union([z.string(), z.literal('3.1.0'), z.literal('4.0.0')])
    .optional()
    .default('3.1.0'),
  /** OAS info */
  info: infoSchema.optional(),
  /** Uids which refer to servers on the workspace base */
  serverUids: z.array(z.string()).default([]),
  /** OAS Tags */
  tags: z.array(tagSchema).default([]),
  externalDocs: exteralDocumentationSchema.optional(),
})

const collectionSchema = z.object({
  uid: nanoidSchema,
  spec: specSchema.optional().default({}),
  /** The currently selected server */
  selectedServerUid: z.string().default(''),
  /**  List of uids that correspond to collection requests or folders */
  childUids: z.array(z.string()).default([]),
})

/**
 * A collection must be able to map 1:1 with an OAS 3.1 spec file
 *
 * Collections will have two modes of display:
 * - Standard: Ordered by tag similar to ApiReference Sidebar
 * - Folder: Ordered into arbitrary folders. See x-scalar-folder.yaml
 */
export type Collection = z.infer<typeof collectionSchema>
export type CollectionPayload = z.input<typeof collectionSchema>

/** Create Collction helper */
export const createCollection = (payload: CollectionPayload): Collection =>
  deepMerge(collectionSchema.parse({}), payload)
