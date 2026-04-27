import type { ExamplesObject } from './examples'
import type { FileSchemaObject } from './file-schema'
import type { HeadersObject } from './headers'
import type { Extensions, SchemaObject } from './schema'
/**
 * Response object
 *
 * Describes a single response from an API Operation.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#response-object}
 */
export type ResponseObject = {
  /** **Required.** A short description of the response. [GFM syntax](https://guides.github.com/features/mastering-markdown/#GitHub-flavored-markdown) can be used for rich text representation. */
  description: string
  /** A definition of the response structure. It can be a primitive, an array or an object. If this field does not exist, it means no content is returned as part of the response. As an extension to the [Schema Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#schema-object), its root `type` value may also be `"file"`. This SHOULD be accompanied by a relevant `produces` mime-type. */
  schema?: SchemaObject | FileSchemaObject
  /** A list of headers that are sent with the response. */
  headers?: HeadersObject
  /** An example of the response message. */
  examples?: ExamplesObject
} & Extensions
