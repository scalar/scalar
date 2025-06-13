import { compose } from '@/schemas/v3.1/compose'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { Type, type Static } from '@sinclair/typebox'

/**
 * An object grouping an internal or external example value with basic summary and description metadata. This object is typically used in fields named examples (plural), and is a referenceable alternative to older example (singular) fields that do not support referencing or metadata.
 *
 * Examples allow demonstration of the usage of properties, parameters and objects within OpenAPI.
 */
export const ExampleObjectSchema = compose(
  Type.Object({
    /** Short description for the example. */
    summary: Type.Optional(Type.String()),
    /** Long description for the example. CommonMark syntax MAY be used for rich text representation. */
    description: Type.Optional(Type.String()),
    /** Embedded literal example. The value field and externalValue field are mutually exclusive. To represent examples of media types that cannot naturally represented in JSON or YAML, use a string value to contain the example, escaping where necessary. */
    value: Type.Optional(Type.Any()),
    /** A URI that identifies the literal example. This provides the capability to reference examples that cannot easily be included in JSON or YAML documents. The value field and externalValue field are mutually exclusive. See the rules for resolving Relative References. */
    externalValue: Type.Optional(Type.String()),
  }),
  ExtensionsSchema,
)

export type ExampleObject = Static<typeof ExampleObjectSchema>
