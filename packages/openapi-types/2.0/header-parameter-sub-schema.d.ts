import type { CollectionFormatObject } from './collection-format'
import type { DefaultObject } from './default'
import type { EnumObject } from './enum'
import type { ExclusiveMaximumObject } from './exclusive-maximum'
import type { ExclusiveMinimumObject } from './exclusive-minimum'
import type { MaxItemsObject } from './max-items'
import type { MaxLengthObject } from './max-length'
import type { MaximumObject } from './maximum'
import type { MinItemsObject } from './min-items'
import type { MinLengthObject } from './min-length'
import type { MinimumObject } from './minimum'
import type { MultipleOfObject } from './multiple-of'
import type { PatternObject } from './pattern'
import type { PrimitivesItemsObject } from './primitives-items'
import type { UniqueItemsObject } from './unique-items'
/**
 * Parameter object
 *
 * Describes a single operation parameter.  A unique parameter is defined by a combination of a [name](#parameterName) and [location](#parameterIn).  There are five possible parameter types. * Path - Used together with [Path Templating](#path-templating), where the parameter value is actually part of the operation's URL. This does not include the host or base path of the API. For example, in `/items/{itemId}`, the path parameter is `itemId`. * Query - Parameters that are appended to the URL. For example, in `/items?id=###`, the query parameter is `id`. * Header - Custom headers that are expected as part of the request. * Body - The payload that's appended to the HTTP request. Since there can only be one payload, there can only be *one* body parameter. The name of the body parameter has no effect on the parameter itself and is used for documentation purposes only. Since Form parameters are also in the payload, body and form parameters cannot exist together for the same operation. * Form - Used to describe the payload of an HTTP request when either `application/x-www-form-urlencoded`, `multipart/form-data` or both are used as the content type of the request (in Swagger's definition, the [`consumes`](#operationConsumes) property of an operation). This is the only parameter type that can be used to send files, thus supporting the `file` type. Since form parameters are sent in the payload, they cannot be declared together with a body parameter for the same operation. Form parameters have a different format based on the content-type used (for further details, consult http://www.w3.org/TR/html401/interact/forms.html#h-17.13.4):   * `application/x-www-form-urlencoded` - Similar to the format of Query parameters but as a payload. For example, `foo=1&bar=swagger` - both `foo` and `bar` are form parameters. This is normally used for simple parameters that are being transferred.   * `multipart/form-data` - each parameter takes a section in the payload with an internal header. For example, for the header `Content-Disposition: form-data; name="submit-name"` the name of the parameter is `submit-name`. This type of form parameters is more commonly used for file transfers.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#parameter-object}
 */
export type HeaderParameterSubSchemaObject = {
  /** Determines whether this parameter is mandatory. If the parameter is [`in`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#parameterIn) "path", this property is **required** and its value MUST be `true`. Otherwise, the property MAY be included and its default value is `false`. */
  required?: boolean
  /** **Required.** The location of the parameter. Possible values are "query", "header", "path", "formData" or "body". */
  in: 'header'
  /** A brief description of the parameter. This could contain examples of use.  [GFM syntax](https://guides.github.com/features/mastering-markdown/#GitHub-flavored-markdown) can be used for rich text representation. */
  description?: string
  /** **Required.** The name of the parameter. Parameter names are *case sensitive*. <ul><li>If [`in`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#parameterIn) is `"path"`, the `name` field MUST correspond to the associated path segment from the [path](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#pathsPath) field in the [Paths Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#paths-object). See [Path Templating](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#path-templating) for further information.<li>For all other cases, the `name` corresponds to the parameter name used based on the [`in`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#parameterIn) property.</ul> */
  name: string
  /** **Required.** The type of the parameter. Since the parameter is not located at the request body, it is limited to simple types (that is, not an object). The value MUST be one of `"string"`, `"number"`, `"integer"`, `"boolean"`, `"array"` or `"file"`. If `type` is `"file"`, the [`consumes`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#operationConsumes) MUST be either `"multipart/form-data"`, `" application/x-www-form-urlencoded"` or both and the parameter MUST be [`in`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#parameterIn) `"formData"`. */
  type: 'string' | 'number' | 'boolean' | 'integer' | 'array'
  /** The extending format for the previously mentioned [`type`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#parameterType). See [Data Type Formats](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#dataTypeFormat) for further details. */
  format?: string
  /** **Required if [`type`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#parameterType) is "array".** Describes the type of items in the array. */
  items?: PrimitivesItemsObject
  /** Determines the format of the array if type array is used. Possible values are: <ul><li>`csv` - comma separated values `foo,bar`. <li>`ssv` - space separated values `foo bar`. <li>`tsv` - tab separated values `foo\tbar`. <li>`pipes` - pipe separated values <code>foo&#124;bar</code>. <li>`multi` - corresponds to multiple parameter instances instead of multiple values for a single instance `foo=bar&foo=baz`. This is valid only for parameters [`in`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#parameterIn) "query" or "formData". </ul> Default value is `csv`. */
  collectionFormat?: CollectionFormatObject
  /** Declares the value of the parameter that the server will use if none is provided, for example a "count" to control the number of results per page might default to 100 if not supplied by the client in the request. (Note: "default" has no meaning for required parameters.)  See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-6.2. Unlike JSON Schema this value MUST conform to the defined [`type`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#parameterType) for this parameter. */
  default?: DefaultObject
  /** See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.1.2. */
  maximum?: MaximumObject
  /** See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.1.2. */
  exclusiveMaximum?: ExclusiveMaximumObject
  /** See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.1.3. */
  minimum?: MinimumObject
  /** See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.1.3. */
  exclusiveMinimum?: ExclusiveMinimumObject
  /** See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.2.1. */
  maxLength?: MaxLengthObject
  /** See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.2.2. */
  minLength?: MinLengthObject
  /** See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.2.3. */
  pattern?: PatternObject
  /** See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.3.2. */
  maxItems?: MaxItemsObject
  /** See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.3.3. */
  minItems?: MinItemsObject
  /** See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.3.4. */
  uniqueItems?: UniqueItemsObject
  /** See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.5.1. */
  enum?: EnumObject
  /** See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.1.1. */
  multipleOf?: MultipleOfObject
}
