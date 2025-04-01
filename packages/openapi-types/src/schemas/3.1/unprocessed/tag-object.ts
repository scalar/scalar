import { TagObjectSchema as OriginalTagObjectSchema } from '../processed/tag-object'

/**
 * Tag Object
 *
 * Adds metadata to a single tag that is used by the Operation Object. It is not mandatory to have a Tag Object per tag
 * defined in the Operation Object instances.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#tag-object
 */
export const TagObjectSchema = OriginalTagObjectSchema
