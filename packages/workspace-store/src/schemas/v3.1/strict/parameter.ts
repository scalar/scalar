import { Type, type Static } from '@sinclair/typebox'

/**
 * Describes a single operation parameter.
 *
 * A unique parameter is defined by a combination of a name and location.
 *
 * See Appendix E for a detailed examination of percent-encoding concerns, including interactions with the application/x-www-form-urlencoded query string format.
 */
export const ParameterObjectSchema = Type.Object({
  /** REQUIRED. The name of the parameter. Parameter names are case sensitive.
   *    - If in is "path", the name field MUST correspond to a template expression occurring within the path field in the Paths Object. See Path Templating for further information.
   *    - If in is "header" and the name field is "Accept", "Content-Type" or "Authorization", the parameter definition SHALL be ignored.
   *    - For all other cases, the name corresponds to the parameter name used by the in field. */
  name: Type.String(),
  /** REQUIRED. The location of the parameter. Possible values are "query", "header", "path" or "cookie". */
  in: Type.String(),
  /** A brief description of the parameter. This could contain examples of use. CommonMark syntax MAY be used for rich text representation. */
  description: Type.Optional(Type.String()),
  /** Determines whether this parameter is mandatory. If the parameter location is "path", this field is REQUIRED and its value MUST be true. Otherwise, the field MAY be included and its default value is false. */
  required: Type.Optional(Type.Boolean()),
  /** Specifies that a parameter is deprecated and SHOULD be transitioned out of usage. Default value is false. */
  deprecated: Type.Optional(Type.Boolean()),
  /** If true, clients MAY pass a zero-length string value in place of parameters that would otherwise be omitted entirely, which the server SHOULD interpret as the parameter being unused. Default value is false. If style is used, and if behavior is n/a (cannot be serialized), the value of allowEmptyValue SHALL be ignored. Interactions between this field and the parameter's Schema Object are implementation-defined. This field is valid only for query parameters. Use of this field is NOT RECOMMENDED, and it is likely to be removed in a later revision. */
  allowEmptyValue: Type.Optional(Type.Boolean()),
})

export type ParameterObject = Static<typeof ParameterObjectSchema>
