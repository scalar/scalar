import { Type } from '@scalar/typebox'

export const NavigationBaseSchemaDefinition = Type.Object({
  id: Type.String(),
  title: Type.String(),
})

export type NavigationBase = {
  /**
   * The unique identifier for the entry
   *
   * Must be unique across the entire navigation structure.
   */
  id: string
  /** The user readable title of the entry */
  title: string
}
