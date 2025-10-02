import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { XDisabled } from '@/schemas/extensions/example/x-disabled'

/**
 * An object grouping an internal or external example value with basic summary and description metadata. This object is typically used in fields named examples (plural), and is a referenceable alternative to older example (singular) fields that do not support referencing or metadata.
 *
 * Examples allow demonstration of the usage of properties, parameters and objects within OpenAPI.
 */
export const ExampleObjectSchemaDefinition = compose(
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
  XDisabled,
)

/**
 * An object grouping an internal or external example value with basic summary and description metadata. This object is typically used in fields named examples (plural), and is a referenceable alternative to older example (singular) fields that do not support referencing or metadata.
 *
 * Examples allow demonstration of the usage of properties, parameters and objects within OpenAPI.
 */
export type ExampleObject = {
  /** Short description for the example. */
  summary?: string
  /** Long description for the example. CommonMark syntax MAY be used for rich text representation. */
  description?: string
  /** Embedded literal example. The value field and externalValue field are mutually exclusive. To represent examples of media types that cannot naturally represented in JSON or YAML, use a string value to contain the example, escaping where necessary. */
  value?: any
  /** A URI that identifies the literal example. This provides the capability to reference examples that cannot easily be included in JSON or YAML documents. The value field and externalValue field are mutually exclusive. See the rules for resolving Relative References. */
  externalValue?: string
  /**
   * OpenAPI extension to control whether a parameter example is enabled (checkbox on) or disabled (checkbox off).
   *
   * This extension is typically used in API tools to determine if a parameter (such as a header, query, or cookie)
   * should be included in the request when sending an example. If `x-disabled: true`, the parameter example is considered
   * "off" (checkbox unchecked) and will not be sent with the request. If `x-disabled: false` or omitted, the parameter
   * example is "on" (checkbox checked) and will be sent.
   */
  'x-disabled'?: boolean
}
