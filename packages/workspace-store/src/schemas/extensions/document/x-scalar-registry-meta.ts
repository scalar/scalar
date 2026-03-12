import { Type } from '@scalar/typebox'

export const XScalarRegistryMetaSchema = Type.Object({
  /**
   * The registry meta for the document.
   */
  'x-scalar-registry-meta': Type.Optional(
    Type.Object({
      /**
       * The namespace under which this registry meta is scoped.
       */
      'namespace': Type.String(),
      /**
       * A unique slug identifier for this registry meta within the namespace.
       */
      'slug': Type.String(),
    }),
  ),
})

export type XScalarRegistryMeta = {
  /**
   * The registry meta for the document.
   */
  'x-scalar-registry-meta'?: {
    /**
     * The namespace under which this registry meta is scoped.
     */
    namespace: string
    /**
     * A unique slug identifier for this registry meta within the namespace.
     */
    slug: string
  }
}
