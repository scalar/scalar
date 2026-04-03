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
 * Header object
 *
 * Field Name | Type | Description ---|:---:|--- <a name="headerDescription"></a>description | `string` | A short description of the header. <a name="headerType"></a>type | `string` | **Required.** The type of the object. The value MUST be one of `"string"`, `"number"`, `"integer"`, `"boolean"`, or `"array"`. <a name="headerFormat"></a>format | `string` | The extending format for the previously mentioned [`type`](#stType). See [Data Type Formats](#dataTypeFormat) for further details. <a name="headerItems"></a>items | [Items Object](#items-object) | **Required if [`type`](#stType) is "array".** Describes the type of items in the array. <a name="headerCollectionFormat"></a>collectionFormat | `string` | Determines the format of the array if type array is used. Possible values are: <ul><li>`csv` - comma separated values `foo,bar`. <li>`ssv` - space separated values `foo bar`. <li>`tsv` - tab separated values `foo\tbar`. <li>`pipes` - pipe separated values <code>foo&#124;bar</code>. </ul> Default value is `csv`. <a name="headerDefault"></a>default | * | Declares the value of the header that the server will use if none is provided. (Note: "default" has no meaning for required headers.) See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-6.2. Unlike JSON Schema this value MUST conform to the defined [`type`](#headerDefault) for the header. <a name="headerMaximum"></a>maximum | `number` | See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.1.2. <a name="headerMaximum"></a>exclusiveMaximum | `boolean` | See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.1.2. <a name="headerMinimum"></a>minimum | `number` | See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.1.3. <a name="headerExclusiveMinimum"></a>exclusiveMinimum | `boolean` | See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.1.3. <a name="headerMaxLength"></a>maxLength | `integer` | See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.2.1. <a name="headerMinLength"></a>minLength | `integer` | See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.2.2. <a name="headerPattern"></a>pattern | `string` | See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.2.3. <a name="headerMaxItems"></a>maxItems | `integer` | See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.3.2. <a name="headerMinItems"></a>minItems | `integer` | See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.3.3. <a name="headerUniqueItems"></a>uniqueItems | `boolean` | https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.3.4. <a name="headerEnum"></a>enum | [*] | See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.5.1. <a name="headerMultipleOf"></a>multipleOf | `number` | See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-5.1.1.
 *
 * @see {@link https://swagger.io/specification/v2/#header-object}
 */
export type HeaderObject = {
  /** **Required.** The type of the parameter. Since the parameter is not located at the request body, it is limited to simple types (that is, not an object). The value MUST be one of `"string"`, `"number"`, `"integer"`, `"boolean"`, `"array"` or `"file"`. If `type` is `"file"`, the [`consumes`](https://swagger.io/specification/v2/#operationConsumes) MUST be either `"multipart/form-data"`, `" application/x-www-form-urlencoded"` or both and the parameter MUST be [`in`](https://swagger.io/specification/v2/#parameterIn) `"formData"`. */
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array'
  /** The extending format for the previously mentioned [`type`](https://swagger.io/specification/v2/#parameterType). See [Data Type Formats](https://swagger.io/specification/v2/#dataTypeFormat) for further details. */
  format?: string
  /** **Required if [`type`](https://swagger.io/specification/v2/#parameterType) is "array".** Describes the type of items in the array. */
  items?: PrimitivesItemsObject
  /** Determines the format of the array if type array is used. Possible values are: <ul><li>`csv` - comma separated values `foo,bar`. <li>`ssv` - space separated values `foo bar`. <li>`tsv` - tab separated values `foo\tbar`. <li>`pipes` - pipe separated values <code>foo&#124;bar</code>. <li>`multi` - corresponds to multiple parameter instances instead of multiple values for a single instance `foo=bar&foo=baz`. This is valid only for parameters [`in`](https://swagger.io/specification/v2/#parameterIn) "query" or "formData". </ul> Default value is `csv`. */
  collectionFormat?: CollectionFormatObject
  /** Declares the value of the parameter that the server will use if none is provided, for example a "count" to control the number of results per page might default to 100 if not supplied by the client in the request. (Note: "default" has no meaning for required parameters.)  See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-6.2. Unlike JSON Schema this value MUST conform to the defined [`type`](https://swagger.io/specification/v2/#parameterType) for this parameter. */
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
  /** A brief description of the parameter. This could contain examples of use.  [GFM syntax](https://guides.github.com/features/mastering-markdown/#GitHub-flavored-markdown) can be used for rich text representation. */
  description?: string
}
