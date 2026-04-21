import type { ExampleObject } from './example'
import type { MediaTypeObject } from './media-type'
import type { ReferenceObject } from './reference'
import type { SchemaObject } from './schema'

type ParameterObjectBase = {
  /** **REQUIRED**. The name of the parameter. Parameter names are _case-sensitive_. <ul><li>If [`in`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#parameter-in) is `"path"`, the `name` field MUST correspond to a single template expression occurring within the [path](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#paths-path) field in the [Paths Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#paths-object). See [Path Templating](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#path-templating) for further information.<li>If [`in`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#parameter-in) is `"header"` and the `name` field is `"Accept"`, `"Content-Type"` or `"Authorization"`, the parameter definition SHALL be ignored.<li>If `in` is `"querystring"`, or for [certain combinations](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#style-examples) of [`style`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#parameter-style) and [`explode`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#parameter-explode), the value of `name` is not used in the parameter serialization.<li>For all other cases, the `name` corresponds to the parameter name used by the [`in`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#parameter-in) field.</ul> */
  name: string
  /** **REQUIRED**. The location of the parameter. Possible values are `"query"`, `"querystring"`, `"header"`, `"path"` or `"cookie"`. */
  in: 'query' | 'querystring' | 'header' | 'path' | 'cookie'
  /** A brief description of the parameter. This could contain examples of use. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** Determines whether this parameter is mandatory. If the [parameter location](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#parameter-in) is `"path"`, this field is **REQUIRED** and its value MUST be `true`. Otherwise, the field MAY be included and its default value is `false`. */
  required?: boolean
  /** Specifies that a parameter is deprecated and SHOULD be transitioned out of usage. Default value is `false`. */
  deprecated?: boolean
  /** Determines whether the parameter value SHOULD allow reserved characters, as defined by [RFC3986](https://tools.ietf.org/html/rfc3986#section-2.2), without percent-encoding. This field only applies to parameters with an `in` value of `query`. The default value is `false`. */
  allowReserved?: boolean
} & Record<`x-${string}`, unknown>

export type ParameterWithSchemaObject = ParameterObjectBase & {
  /** Describes how the parameter value will be serialized depending on the type of the parameter value. */
  style?: string
  /** When this is true, parameter values of type `array` or `object` generate separate parameters for each value of the array or key-value pair of the map. For other types of parameters this field has no effect. When [`style`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#parameter-style) is `form`, the default value is `true`. For all other styles, the default value is `false`. */
  explode?: boolean
  /** The schema defining the type used for the parameter. */
  schema: SchemaObject
  /** Example of the parameter's potential value; see [Working With Examples](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#working-with-examples). */
  example?: unknown
  /** Examples of the parameter's potential value; see [Working With Examples](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#working-with-examples). */
  examples?: Record<string, ExampleObject | ReferenceObject>
}

export type ParameterWithContentObject = ParameterObjectBase & {
  /** A map containing the representations for the parameter. The key is the media type and the value describes it. The map MUST only contain one entry. */
  content: Record<string, MediaTypeObject>
}

/**
 * Parameter object
 *
 * Describes a single operation parameter.  A unique parameter is defined by a combination of a [name](#parameter-name) and [location](#parameter-in).  See [Appendix E](#appendix-e-percent-encoding-and-form-media-types) for a detailed examination of percent-encoding concerns, including interactions with the `application/x-www-form-urlencoded` query string format.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#parameter-object}
 */
export type ParameterObject = ParameterWithSchemaObject | ParameterWithContentObject
