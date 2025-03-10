import { omitUndefinedValues } from '@/entities/specification/utils/omit-undefined-values'
import { z } from 'zod'

/**
 * External Documentation Object
 *
 * Allows referencing an external resource for extended documentation.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#external-documentation-object
 */
export const ExternalDocumentationSchema = z
  .object({
    /** A description of the target documentation. CommonMark syntax MAY be used for rich text representation. */
    description: z.string().optional().catch(undefined),
    /** REQUIRED. The URL for the target documentation. This MUST be in the form of a URL. */
    url: z.string(),
  })
  .transform(omitUndefinedValues)

export type ExternalDocumentation = z.infer<typeof ExternalDocumentationSchema>
