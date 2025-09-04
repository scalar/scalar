import { Type } from '@scalar/typebox'

/** An object representing a Server Variable for server URL template substitution. */
export const ServerVariableObjectSchemaDefinition = Type.Object({
  /** An enumeration of string values to be used if the substitution options are from a limited set. The array MUST NOT be empty. */
  enum: Type.Optional(Type.Array(Type.String())),
  /** REQUIRED. The default value to use for substitution, which SHALL be sent if an alternate value is not supplied. If the enum is defined, the value MUST exist in the enum's values. Note that this behavior is different from the Schema Object's default keyword, which documents the receiver's behavior rather than inserting the value into the data. */
  default: Type.Optional(Type.String()),
  /** An optional description for the server variable. CommonMark syntax MAY be used for rich text representation. */
  description: Type.Optional(Type.String()),
})
