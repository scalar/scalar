import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { ExampleObjectRef, MediaTypeObjectRef, SchemaObjectRef } from '@/schemas/v3.1/strict/ref-definitions'
import { reference } from '@/schemas/v3.1/strict/reference'

export const ParameterObjectBaseSchema = Type.Object({
  /** REQUIRED. The name of the parameter. Parameter names are case sensitive.
   *    - If in is "path", the name field MUST correspond to a template expression occurring within the path field in the Paths Object. See Path Templating for further information.
   *    - If in is "header" and the name field is "Accept", "Content-Type" or "Authorization", the parameter definition SHALL be ignored.
   *    - For all other cases, the name corresponds to the parameter name used by the in field. */
  name: Type.String(),
  /** REQUIRED. The location of the parameter. Possible values are "query", "header", "path" or "cookie". */
  in: Type.Union([Type.Literal('query'), Type.Literal('header'), Type.Literal('path'), Type.Literal('cookie')]),
  /** A brief description of the parameter. This could contain examples of use. CommonMark syntax MAY be used for rich text representation. */
  description: Type.Optional(Type.String()),
  /** Determines whether this parameter is mandatory. If the parameter location is "path", this field is REQUIRED and its value MUST be true. Otherwise, the field MAY be included and its default value is false. */
  required: Type.Optional(Type.Boolean()),
  /** Specifies that a parameter is deprecated and SHOULD be transitioned out of usage. Default value is false. */
  deprecated: Type.Optional(Type.Boolean()),
  /** If true, clients MAY pass a zero-length string value in place of parameters that would otherwise be omitted entirely, which the server SHOULD interpret as the parameter being unused. Default value is false. If style is used, and if behavior is n/a (cannot be serialized), the value of allowEmptyValue SHALL be ignored. Interactions between this field and the parameter's Schema Object are implementation-defined. This field is valid only for query parameters. Use of this field is NOT RECOMMENDED, and it is likely to be removed in a later revision. */
  allowEmptyValue: Type.Optional(Type.Boolean()),
})

export const ParameterObjectWithSchemaSchema = compose(
  ParameterObjectBaseSchema,
  Type.Object({
    /** Describes how the header value will be serialized. The default (and only legal value for headers) is "simple". */
    style: Type.Optional(Type.String()),
    /** When this is true, header values of type array or object generate a single header whose value is a comma-separated list of the array items or key-value pairs of the map, see Style Examples. For other data types this field has no effect. The default value is false. */
    explode: Type.Optional(Type.Boolean()),
    /** The schema defining the type used for the header. */
    schema: Type.Optional(Type.Union([SchemaObjectRef, reference(SchemaObjectRef)])),
    /** Example of the header's potential value; see Working With Examples. https://swagger.io/specification/#working-with-examples */
    example: Type.Optional(Type.Any()),
    /** Examples of the header's potential value; see Working With Examples. https://swagger.io/specification/#working-with-examples */
    examples: Type.Optional(Type.Record(Type.String(), Type.Union([ExampleObjectRef, reference(ExampleObjectRef)]))),
  }),
)

export const ParameterObjectWithContentSchema = compose(
  ParameterObjectBaseSchema,
  Type.Object({
    content: Type.Optional(Type.Record(Type.String(), MediaTypeObjectRef)),
  }),
)

/**
 * Describes a single operation parameter.
 *
 * A unique parameter is defined by a combination of a name and location.
 *
 * See Appendix E for a detailed examination of percent-encoding concerns, including interactions with the application/x-www-form-urlencoded query string format.
 */
export const ParameterObjectSchemaDefinition = Type.Union([
  ParameterObjectWithSchemaSchema,
  ParameterObjectWithContentSchema,
])
