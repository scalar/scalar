import type { PathItemObject } from './path-item'
/**
 * Paths object
 *
 * Holds the relative paths to the individual endpoints and their operations. The path is appended to the URL from the [Server Object](#server-object) in order to construct the full URL. The Paths Object MAY be empty, due to [Access Control List (ACL) constraints](#security-filtering).
 *
 * @see {@link https://spec.openapis.org/oas/v3.1#paths-object}
 */
export type PathsObject = Record<string, PathItemObject>
