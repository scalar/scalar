import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Display-only Protobuf tags; never serialized into an API description. */
export const protobufFieldNumber = Symbol('protobuf-field-number')

/** Display-only presence semantics for optional Protobuf fields. */
export const protobufPresence = Symbol('protobuf-presence')

/** Schema carrying the native wire identifier for a Protobuf field. */
export type ProtobufSchema = SchemaObject & {
  [protobufFieldNumber]?: number
  [protobufPresence]?: 'explicit' | 'implicit'
}
