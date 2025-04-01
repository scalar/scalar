import { z } from 'zod'
import { ExampleObjectSchema } from './example-object'
import { MediaTypeObjectSchema } from './media-type-object'
import { SchemaObjectSchema } from './schema-object'

/**
 * Parameter Object
 *
 * Describes a single operation parameter.
 *
 * A unique parameter is defined by a combination of a name and location.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#parameter-object
 */
export const ParameterObjectSchema = z.object({
  /**
   * REQUIRED. The name of the parameter. Parameter names are case sensitive.
   *
   * - If in is "path", the name field MUST correspond to a template expression occurring within the path field in the
   *   Paths Object. See Path Templating for further information.
   * - If in is "header" and the name field is "Accept", "Content-Type" or "Authorization", the parameter definition
   *   SHALL be ignored.
   * - For all other cases, the name corresponds to the parameter name used by the in property.
   **/
  name: z.string(),
  /**
   * REQUIRED. The location of the parameter. Possible values are "query", "header", "path" or "cookie".
   **/
  in: z.enum(['query', 'header', 'path', 'cookie']),
  /**
   * A brief description of the parameter. This could contain examples of use. CommonMark syntax MAY be used for rich
   * text representation.
   **/
  description: z.string().optional(),
  /**
   * Determines whether this parameter is mandatory. If the parameter location is "path", this property is REQUIRED and
   * its value MUST be true. Otherwise, the property MAY be included and its default value is false.
   **/
  required: z.boolean().optional(),
  /**
   * Specifies that a parameter is deprecated and SHOULD be transitioned out of usage. Default value is false.
   **/
  deprecated: z.boolean().optional(),
  /**
   * Sets the ability to pass empty-valued parameters. This is valid only for query parameters and allows sending a
   * parameter with an empty value. Default value is false. If style is used, and if behavior is n/a (cannot be
   * serialized), the value of allowEmptyValue SHALL be ignored. Use of this property is NOT RECOMMENDED, as it is
   * likely to be removed in a later revision.
   **/
  allowEmptyValue: z.boolean().optional(),
  /**
   * Describes how the parameter value will be serialized depending on the type of the parameter value. Default values
   * (based on value of in): for query - form; for path - simple; for header - simple; for cookie - form.
   **/
  style: z.enum(['matrix', 'label', 'form', 'simple', 'spaceDelimited', 'pipeDelimited', 'deepObject']).optional(),
  /**
   * When this is true, parameter values of type array or object generate separate parameters for each value of the
   * array or key-value pair of the map. For other types of parameters this property has no effect. When style is form,
   * the default value is true. For all other styles, the default value is false. */
  explode: z.boolean().optional(),
  /**
   * Determines whether the parameter value SHOULD allow reserved characters, as defined by RFC3986 :/?#[]@!$&'()*+,;=
   * to be included without percent-encoding. This property only applies to parameters with an in value of query.
   * The default value is false.
   **/
  allowReserved: z.boolean().optional(),
  /**
   * The schema defining the type used for the parameter.
   **/
  schema: SchemaObjectSchema.optional(),
  /**
   * Example of the parameter's potential value. The example SHOULD match the specified schema and encoding properties
   * if present. The example field is mutually exclusive of the examples field. Furthermore, if referencing a schema
   * that contains an example, the example value SHALL override the example provided by the schema. To represent
   * examples of media types that cannot naturally be represented in JSON or YAML, a string value can contain the
   * example with escaping where necessary.
   **/
  example: z.any().optional(),
  /**
   * Examples of the parameter's potential value. Each example SHOULD contain a value in the correct format as
   * specified in the parameter encoding. The examples field is mutually exclusive of the example field. Furthermore,
   * if referencing a schema that contains an example, the examples value SHALL override the example provided by the
   * schema.
   **/
  examples: z.record(z.string(), ExampleObjectSchema).optional(),
  /**
   * A map containing the representations for the parameter. The key is the media type and the value describes it.
   * The map MUST only contain one entry.
   **/
  content: z.record(z.string(), MediaTypeObjectSchema).optional(),
})
