/**
 * The Multi Format Schema Object represents a schema definition that can be in multiple formats (JSON Schema, Avro, Protobuf, etc.).
 */
export type MultiFormatSchemaObject = {
  /** REQUIRED. A string containing the name of the schema format that is used to define the message payload. */
  schemaFormat: string
  /** REQUIRED. Definition of the message payload. It can be of any type but defaults to Schema Object. It MUST match the schema format defined in schemaFormat, including the encoding type. */
  schema: any
}
