import { z } from 'zod'

/**
 * License information for the exposed API.
 *
 * @see https://spec.openapis.org/oas/latest.html#license-object
 */
export const licenseSchema = z.object({
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
export const contactSchema = z.object({
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
export const infoSchema = z.object({
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
export const exteralDocumentationSchema = z.object({
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
export const tagSchema = z.object({
  /** REQUIRED. The name of the tag. */
  name: z.string().optional().default('default'),
  /** A description for the tag. CommonMark syntax MAY be used for rich text representation. */
  description: z.string().optional(),
  /** Additional external documentation for this tag. */
  externalDocs: exteralDocumentationSchema.optional(),
})

/**
 * Security Requirement
 * Lists the required security schemes to execute this operation OR the whole collection/spec.
 * The name used for each property MUST correspond to a security scheme declared in the Security
 * Schemes under the Components Object.
 *
 * The key (name) here will be matched to the key of the securityScheme for linking
 *
 * @see https://spec.openapis.org/oas/latest.html#security-requirement-object
 */
export const securityRequirement = z.record(
  z.string(),
  z.array(z.string()).optional().default([]),
)

export const specSchema = z.object({
  openapi: z
    .union([z.string(), z.literal('3.1.0'), z.literal('4.0.0')])
    .optional()
    .default('3.1.0'),
  /**
   * A declaration of which security mechanisms can be used across the API. The list of
   * values includes alternative security requirement objects that can be used. Only
   * one of the security requirement objects need to be satisfied to authorize a request.
   * Individual operations can override this definition. To make security optional, an empty
   * security requirement ({}) can be included in the array.
   */
  security: z.array(securityRequirement).optional().default([]),
  /** OAS info */
  info: infoSchema.optional(),
  /** Uids which refer to servers on the workspace base */
  serverUids: z.array(z.string()).default([]),
  /** OAS Tags */
  tags: z.array(tagSchema).default([]),
  externalDocs: exteralDocumentationSchema.optional(),
})
