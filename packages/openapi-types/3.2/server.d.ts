import type { ServerVariableObject } from './server-variable'
/**
 * Server object
 *
 * An object representing a Server.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#server-object}
 */
export type ServerObject = {
  /** **REQUIRED**. A URL to the target host. This URL supports Server Variables and MAY be relative, to indicate that the host location is relative to the location where the document containing the Server Object is being served. Query and fragment MUST NOT be part of this URL. Variable substitutions will be made when a variable is named in `{`braces`}`. */
  url: string
  /** An optional string describing the host designated by the URL. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** An optional unique string to refer to the host designated by the URL. */
  name?: string
  /** A map between a variable name and its value. The value is used for substitution in the server's URL template. */
  variables?: Record<string, ServerVariableObject>
} & Record<`x-${string}`, unknown>
