import { Type } from '@scalar/typebox'
import { object, optional, string } from '@scalar/validation'

const XScalarRegistryMetaInnerSchema = Type.Object({
  /**
   * The namespace under which this registry meta is scoped.
   */
  'namespace': Type.String(),
  /**
   * A unique slug identifier for this registry meta within the namespace.
   */
  'slug': Type.String(),
  /**
   * The version of the registry meta.
   */
  'version': Type.String(),
  /**
   * Last known commit hash of this document.
   *
   * Is going to be used to track if the document has been modified since it was last saved.
   */
  'commitHash': Type.Optional(Type.String()),
})

export const XScalarRegistryMetaSchema = Type.Object({
  /**
   * The registry meta for the document.
   */
  'x-scalar-registry-meta': Type.Optional(XScalarRegistryMetaInnerSchema),
})

const XScalarRegistryMetaInner = object(
  {
    namespace: string({ typeComment: 'The namespace under which this registry meta is scoped.' }),
    slug: string({ typeComment: 'A unique slug identifier for this registry meta within the namespace.' }),
    version: string({ typeComment: 'The version of the registry meta.' }),
    commitHash: optional(
      string({
        typeComment:
          'Last known commit hash of this document. Is going to be used to track if the document has been modified since it was last saved.',
      }),
    ),
  },
  {
    typeName: 'XScalarRegistryMetaInner',
    typeComment: 'Registry meta namespace and slug',
  },
)

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

export const XScalarRegistryMeta = object(
  {
    'x-scalar-registry-meta': optional(XScalarRegistryMetaInner),
  },
  {
    typeName: 'XScalarRegistryMeta',
    typeComment: 'The registry meta for the document',
  },
)
