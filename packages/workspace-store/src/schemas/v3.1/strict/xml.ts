import { compose } from '@/schemas/v3.1/compose'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { Type, type Static } from '@sinclair/typebox'

/**
 * A metadata object that allows for more fine-tuned XML model definitions.
 *
 * When using arrays, XML element names are not inferred (for singular/plural forms) and the name field SHOULD be used to add that information. See examples for expected behavior.
 */
export const XMLObjectSchema = compose(
  Type.Object({
    /** Replaces the name of the element/attribute used for the described schema property. When defined within items, it will affect the name of the individual XML elements within the list. When defined alongside type being "array" (outside the items), it will affect the wrapping element if and only if wrapped is true. If wrapped is false, it will be ignored. */
    name: Type.Optional(Type.String()),
    /** The URI of the namespace definition. Value MUST be in the form of a non-relative URI. */
    namespace: Type.Optional(Type.String()),
    /** The prefix to be used for the name. */
    prefix: Type.Optional(Type.String()),
    /** Declares whether the property definition translates to an attribute instead of an element. Default value is false. */
    attribute: Type.Optional(Type.Boolean()),
    /** MAY be used only for an array definition. Signifies whether the array is wrapped (for example, <books><book/><book/></books>) or unwrapped (<book/><book/>). Default value is false. The definition takes effect only when defined alongside type being "array" (outside the items). */
    wrapped: Type.Optional(Type.Boolean()),
  }),
  ExtensionsSchema,
)

export type XMLObject = Static<typeof XMLObjectSchema>
