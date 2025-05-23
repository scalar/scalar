import { Type } from '@sinclair/typebox'
import { ServerVariableObject } from './server-variable'

/** An object representing a Server. */
export const ServerObject = Type.Object({
  /** REQUIRED. A URL to the target host. This URL supports Server Variables and MAY be relative, to indicate that the host location is relative to the location where the document containing the Server Object is being served. Variable substitutions will be made when a variable is named in {braces}. */
  url: Type.String(),
  /** An optional string describing the host designated by the URL. CommonMark syntax MAY be used for rich text representation. */
  description: Type.Optional(Type.String()),
  /** A map between a variable name and its value. The value is used for substitution in the server's URL template. */
  variables: Type.Optional(Type.Record(Type.String(), ServerVariableObject)),
})
