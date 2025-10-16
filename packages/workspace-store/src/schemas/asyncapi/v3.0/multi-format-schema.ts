import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

/**
 * The Multi Format Schema Object represents a schema definition that can be in multiple formats (JSON Schema, Avro, Protobuf, etc.).
 */
export const MultiFormatSchemaSchemaDefinition = compose(
  Type.Object({
    /** REQUIRED. A string containing the name of the schema format that is used to define the message payload. Supported values include 'application/vnd.aai.asyncapi;version=3.0.0', 'application/vnd.aai.asyncapi+json;version=3.0.0', 'application/vnd.aai.asyncapi+yaml;version=3.0.0', 'application/vnd.oai.openapi;version=3.0.0', 'application/vnd.oai.openapi+json;version=3.0.0', 'application/vnd.oai.openapi+yaml;version=3.0.0', 'application/vnd.apache.avro;version=1.9.0', 'application/vnd.apache.avro+json;version=1.9.0', 'application/vnd.apache.avro+yaml;version=1.9.0', 'application/raml+yaml;version=1.0', and 'application/schema+json;version=draft-07', 'application/schema+yaml;version=draft-07'. */
    schemaFormat: Type.String(),
    /** REQUIRED. Definition of the message payload. It can be of any type but defaults to Schema Object. It MUST match the schema format defined in schemaFormat, including the encoding type. */
    schema: Type.Any(),
  }),
)

/**
 * The Multi Format Schema Object represents a schema definition that can be in multiple formats (JSON Schema, Avro, Protobuf, etc.).
 */
export type MultiFormatSchema = {
  /** REQUIRED. A string containing the name of the schema format that is used to define the message payload. */
  schemaFormat: string
  /** REQUIRED. Definition of the message payload. It can be of any type but defaults to Schema Object. It MUST match the schema format defined in schemaFormat, including the encoding type. */
  schema: any
}
