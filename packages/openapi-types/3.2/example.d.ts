/**
 * Example object
 *
 * An object grouping an internal or external example value with basic `summary` and `description` metadata. The examples can show either data suitable for schema validation, or serialized data as required by the containing [Media Type Object](#media-type-object), [Parameter Object](#parameter-object), or [Header Object](#header-object). This object is typically used in fields named `examples` (plural), and is a [referenceable](#reference-object) alternative to older `example` (singular) fields that do not support referencing or metadata. The various fields and types of examples are explained in more detail under [Working With Examples](#working-with-examples).
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#example-object}
 */
export type ExampleObject = {
  /** Short description for the example. */
  summary?: string
  /** Long description for the example. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** An example of the data structure that MUST be valid according to the relevant [Schema Object](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#schema-object).  If this field is present, `value` MUST be absent. */
  dataValue?: boolean
  /** An example of the serialized form of the value, including encoding and escaping as described under [Validating Examples](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#validating-examples).  If `dataValue` is present, then this field SHOULD contain the serialization of the given data.  Otherwise, it SHOULD be the valid serialization of a data value that itself MUST be valid as described for `dataValue`.  This field SHOULD NOT be used if the serialization format is JSON, as the data form is easier to work with. If this field is present, `value`, and `externalValue` MUST be absent. */
  serializedValue?: string
  /** Embedded literal example. The `value` field and `externalValue` field are mutually exclusive. To represent examples of media types that cannot naturally be represented in JSON or YAML, use a string value to contain the example, escaping where necessary.<br><br>**Deprecated for non-JSON serialization targets:** Use `dataValue` and/or `serializedValue`, which both have unambiguous syntax and semantics, instead. */
  value?: boolean
  /** A URI that identifies the serialized example in a separate document, allowing for values not easily or readably expressed as a Unicode string.  If `dataValue` is present, then this field SHOULD identify a serialization of the given data.  Otherwise, the value SHOULD be the valid serialization of a data value that itself MUST be valid as described for `dataValue`. If this field is present, `serializedValue` and `value` MUST be absent. See also the rules for resolving [Relative References](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#relative-references-in-api-description-uris). */
  externalValue?: string
} & Record<`x-${string}`, unknown>
