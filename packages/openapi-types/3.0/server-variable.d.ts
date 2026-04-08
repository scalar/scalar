/**
 * Server Variable object
 *
 * An object representing a Server Variable for server URL template substitution.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#server-variable-object}
 */
export type ServerVariableObject = {
  /** An enumeration of string values to be used if the substitution options are from a limited set. The array SHOULD NOT be empty. */
  enum?: string[]
  /** **REQUIRED**. The default value to use for substitution, which SHALL be sent if an alternate value is _not_ supplied. If the [`enum`](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#server-variable-enum) is defined, the value SHOULD exist in the enum's values. Note that this behavior is different from the [Schema Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#schema-object)'s `default` keyword, which documents the receiver's behavior rather than inserting the value into the data. */
  default: string
  /** An optional description for the server variable. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
}
