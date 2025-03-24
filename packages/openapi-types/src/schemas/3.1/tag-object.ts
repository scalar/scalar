import { z } from 'zod'
import { ExternalDocumentationObjectSchema } from './external-documentation-object'

/**
 * Tag Object
 *
 * Adds metadata to a single tag that is used by the Operation Object. It is not mandatory to have a Tag Object per tag
 * defined in the Operation Object instances.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#tag-object
 */
export const TagObjectSchema = z.object({
  /** REQUIRED. The name of the tag. */
  'name': z.string(),
  /** A description for the tag. CommonMark syntax MAY be used for rich text representation. */
  'description': z.string().optional().catch(undefined),
  /** Additional external documentation for this tag. */
  'externalDocs': ExternalDocumentationObjectSchema.optional(),
})
