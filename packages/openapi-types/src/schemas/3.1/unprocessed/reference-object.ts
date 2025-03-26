import { z } from 'zod'

/**
 * Reference Object
 *
 * A simple object to allow referencing other components in the OpenAPI Description, internally and externally.
 *
 * The $ref string value contains a URI RFC3986, which identifies the value being referenced.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#reference-object
 */
export const ReferenceObjectSchema = z.object({
  /**
   * REQUIRED. The reference identifier. This MUST be in the form of a URI.
   */
  $ref: z.string(),
  /**
   * A short summary which by default SHOULD override that of the referenced component. If the referenced object-type
   * does not allow a summary field, then this field has no effect.
   */
  summary: z.string().optional(),
  /**
   * A description which by default SHOULD override that of the referenced component. CommonMark syntax MAY be used for
   * rich text representation. If the referenced object-type does not allow a description field, then this field has no
   * effect.
   */
  description: z.string().optional(),
})
