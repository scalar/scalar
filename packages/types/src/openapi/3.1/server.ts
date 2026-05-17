import type { ServerVariableObject } from './server-variable'

export type ServerObject = {
  /** REQUIRED. A URL to the target host. This URL supports Server Variables and MAY be relative, to indicate that the host location is relative to the location where the document containing the Server Object is being served. Variable substitutions will be made when a variable is named in {braces}. */
  url: string
  /** An optional string describing the host designated by the URL. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** A map between a variable name and its value. The value is used for substitution in the server's URL template. */
  variables?: Record<string, ServerVariableObject>
}
