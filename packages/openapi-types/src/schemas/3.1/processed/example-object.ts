import { z } from 'zod'

/**
 * Example Object
 *
 * An object grouping an internal or external example value with basic summary and description metadata. This object is
 * typically used in fields named examples (plural), and is a referenceable alternative to older example (singular)
 * fields that do not support referencing or metadata.
 *
 * Examples allow demonstration of the usage of properties, parameters and objects within OpenAPI.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#example-object
 */
export const ExampleObjectSchema = z.object({
  /**
   * Short description for the example.
   */
  summary: z.string().optional(),
  /**
   * Long description for the example. CommonMark syntax MAY be used for rich text representation.
   */
  description: z.string().optional(),
  /**
   * Embedded literal example. The value field and externalValue field are mutually exclusive. To represent examples of media types that cannot naturally represented in JSON or YAML, use a string value to contain the example, escaping where necessary.
   */
  value: z.any().optional(),
  /**
   * A URI that identifies the literal example. This provides the capability to reference examples that cannot easily be
   * included in JSON or YAML documents. The value field and externalValue field are mutually exclusive. See the rules
   * for resolving Relative References.
   */
  externalValue: z.string().optional(),
})
