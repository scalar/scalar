import type { PathItemObject } from './path-item'
/**
 * Paths object
 *
 * Holds the relative paths to the individual endpoints. The path is appended to the [`basePath`](#swaggerBasePath) in order to construct the full URL. The Paths may be empty, due to [ACL constraints](#security-filtering).
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#paths-object}
 */
export type PathsObject = Record<string, PathItemObject>
