import { PathsObjectSchema as OriginalPathsObjectSchema } from '../processed/paths-object'

/**
 * Paths Object
 *
 * Holds the relative paths to the individual endpoints and their operations. The path is appended to the URL from the
 * Server Object in order to construct the full URL. The Paths Object MAY be empty, due to Access Control List (ACL)
 * constraints.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#paths-object
 */
export const PathsObjectSchema = OriginalPathsObjectSchema
