import type { EncodingObject } from './encoding'
import type { ExampleObject } from './example'
import type { ReferenceType } from './reference'
import type { SchemaObject } from './schema'

export type MediaTypeObject = {
  /** The schema defining the content of the request, response, parameter, or header. */
  schema?: ReferenceType<SchemaObject>
  /** Example of the media type */
  example?: any
  /** Examples of the media type */
  examples?: Record<string, ReferenceType<ExampleObject>>
  /** A map between a property name and its encoding information. The key, being the property name, MUST exist in the schema as a property. The encoding field SHALL only apply to Request Body Objects, and only when the media type is multipart or application/x-www-form-urlencoded. If no Encoding Object is provided for a property, the behavior is determined by the default values documented for the Encoding Object. */
  encoding?: Record<string, EncodingObject>
}
