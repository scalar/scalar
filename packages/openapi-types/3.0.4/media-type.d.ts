import type { EncodingObject } from './encoding'
import type { ExampleObject } from './example'
import type { ExampleXorExamplesObject } from './example-xor-examples'
import type { ReferenceObject } from './reference'
import type { SchemaObject } from './schema'
/**
 * Media Type object
 *
 * Each Media Type Object provides schema and examples for the media type identified by its key.  When `example` or `examples` are provided, the example SHOULD match the specified schema and be in the correct format as specified by the media type and its encoding. The `example` and `examples` fields are mutually exclusive, and if either is present it SHALL _override_ any `example` in the schema. See [Working With Examples](#working-with-examples) for further guidance regarding the different ways of specifying examples, including non-JSON/YAML values.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4#media-type-object}
 */
export type MediaTypeObject = {
  /** The schema defining the content of the request, response, parameter, or header. */
  schema?: SchemaObject | ReferenceObject
  /** Example of the media type; see [Working With Examples](https://spec.openapis.org/oas/v3.0.4#working-with-examples). */
  example?: unknown
  /** Examples of the media type; see [Working With Examples](https://spec.openapis.org/oas/v3.0.4#working-with-examples). */
  examples?: Record<string, ExampleObject | ReferenceObject>
  /** A map between a property name and its encoding information. The key, being the property name, MUST exist in the schema as a property. The `encoding` field SHALL only apply to [Request Body Objects](https://spec.openapis.org/oas/v3.0.4#request-body-object), and only when the media type is `multipart` or `application/x-www-form-urlencoded`. If no Encoding Object is provided for a property, the behavior is determined by the default values documented for the Encoding Object. */
  encoding?: Record<string, EncodingObject>
} & ExampleXorExamplesObject
