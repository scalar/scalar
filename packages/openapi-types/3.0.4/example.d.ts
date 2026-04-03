/**
 * Example object
 *
 * An object grouping an internal or external example value with basic `summary` and `description` metadata. This object is typically used in fields named `examples` (plural), and is a [referenceable](#reference-object) alternative to older `example` (singular) fields that do not support referencing or metadata.  Examples allow demonstration of the usage of properties, parameters and objects within OpenAPI.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4#example-object}
 */
export type ExampleObject = {
  /** Short description for the example. */
  summary?: string
  /** Long description for the example. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** Embedded literal example. The `value` field and `externalValue` field are mutually exclusive. To represent examples of media types that cannot naturally represented in JSON or YAML, use a string value to contain the example, escaping where necessary. */
  value?: unknown
  /** A URL that points to the literal example. This provides the capability to reference examples that cannot easily be included in JSON or YAML documents. The `value` field and `externalValue` field are mutually exclusive. See the rules for resolving [Relative References](https://spec.openapis.org/oas/v3.0.4#relative-references-in-urls). */
  externalValue?: string
}
