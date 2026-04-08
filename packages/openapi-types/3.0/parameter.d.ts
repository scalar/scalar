import type { ExampleObject } from './example'
import type { ExampleXorExamplesObject } from './example-xor-examples'
import type { MediaTypeObject } from './media-type'
import type { ReferenceObject } from './reference'
import type { SchemaObject } from './schema'
import type { SchemaXorContentObject } from './schema-xor-content'
/**
 * Parameter object
 *
 * Describes a single operation parameter.  A unique parameter is defined by a combination of a [name](#parameter-name) and [location](#parameter-in).  See [Appendix E](#appendix-e-percent-encoding-and-form-media-types) for a detailed examination of percent-encoding concerns, including interactions with the `application/x-www-form-urlencoded` query string format.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#parameter-object}
 */
export type ParameterObject = {
  /** **REQUIRED**. The name of the parameter. Parameter names are _case sensitive_. <ul><li>If [`in`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#parameter-in) is `"path"`, the `name` field MUST correspond to a template expression occurring within the [path](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#paths-path) field in the [Paths Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#paths-object). See [Path Templating](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#path-templating) for further information.<li>If [`in`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#parameter-in) is `"header"` and the `name` field is `"Accept"`, `"Content-Type"` or `"Authorization"`, the parameter definition SHALL be ignored.<li>For all other cases, the `name` corresponds to the parameter name used by the [`in`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#parameter-in) field.</ul> */
  name: string
  /** **REQUIRED**. The location of the parameter. Possible values are `"query"`, `"header"`, `"path"` or `"cookie"`. */
  in: string
  /** A brief description of the parameter. This could contain examples of use. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** Determines whether this parameter is mandatory. If the [parameter location](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#parameter-in) is `"path"`, this field is **REQUIRED** and its value MUST be `true`. Otherwise, the field MAY be included and its default value is `false`. */
  required?: boolean
  /** Specifies that a parameter is deprecated and SHOULD be transitioned out of usage. Default value is `false`. */
  deprecated?: boolean
  /** If `true`, clients MAY pass a zero-length string value in place of parameters that would otherwise be omitted entirely, which the server SHOULD interpret as the parameter being unused. Default value is `false`. If [`style`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#parameter-style) is used, and if [behavior is _n/a_ (cannot be serialized)](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#style-examples), the value of `allowEmptyValue` SHALL be ignored. Interactions between this field and the parameter's [Schema Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#schema-object) are implementation-defined. This field is valid only for `query` parameters. Use of this field is NOT RECOMMENDED, and it is likely to be removed in a later revision. */
  allowEmptyValue?: boolean
  /** Describes how the parameter value will be serialized depending on the type of the parameter value. Default values (based on value of `in`): for `"query"` - `"form"`; for `"path"` - `"simple"`; for `"header"` - `"simple"`; for `"cookie"` - `"form"`. */
  style?: string
  /** When this is true, parameter values of type `array` or `object` generate separate parameters for each value of the array or key-value pair of the map. For other types of parameters this field has no effect. When [`style`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#parameter-style) is `"form"`, the default value is `true`. For all other styles, the default value is `false`. Note that despite `false` being the default for `deepObject`, the combination of `false` with `deepObject` is undefined. */
  explode?: boolean
  /** When this is true, parameter values are serialized using reserved expansion, as defined by [RFC6570](https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.3), which allows [RFC3986's reserved character set](https://datatracker.ietf.org/doc/html/rfc3986#section-2.2), as well as percent-encoded triples, to pass through unchanged, while still percent-encoding all other disallowed characters (including `%` outside of percent-encoded triples). Applications are still responsible for percent-encoding reserved characters that are [not allowed in the query string](https://datatracker.ietf.org/doc/html/rfc3986#section-3.4) (`[`, `]`, `#`), or have a special meaning in `application/x-www-form-urlencoded` (`-`, `&`, `+`); see Appendices [C](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#appendix-c-using-rfc6570-based-serialization) and [E](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#appendix-e-percent-encoding-and-form-media-types) for details. This field only applies to parameters with an `in` value of `query`. The default value is `false`. */
  allowReserved?: boolean
  /** The schema defining the type used for the parameter. */
  schema?: SchemaObject | ReferenceObject
  /** A map containing the representations for the parameter. The key is the media type and the value describes it. The map MUST only contain one entry. */
  content?: Record<string, MediaTypeObject>
  /** Example of the parameter's potential value; see [Working With Examples](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#working-with-examples). */
  example?: unknown
  /** Examples of the parameter's potential value; see [Working With Examples](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#working-with-examples). */
  examples?: Record<string, ExampleObject | ReferenceObject>
} & ExampleXorExamplesObject &
  SchemaXorContentObject
