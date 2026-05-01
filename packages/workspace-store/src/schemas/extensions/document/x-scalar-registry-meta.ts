import { Type } from '@scalar/typebox'
import { boolean, object, optional, string } from '@scalar/validation'

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
  /**
   * Registry commit hash that the cached `hasConflict` flag was computed
   * against. When the registry advertises a different hash later, the
   * cached result is stale and the conflict check has to be re-run.
   */
  'conflictCheckedAgainstHash': Type.Optional(Type.String()),
  /**
   * Cached outcome of the last conflict check, valid only while
   * `conflictCheckedAgainstHash` matches the registry's current hash for
   * this version.
   */
  'hasConflict': Type.Optional(Type.Boolean()),
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
    conflictCheckedAgainstHash: optional(
      string({
        typeComment:
          'Registry commit hash that the cached hasConflict flag was computed against. The cache is invalid when this no longer matches the registry hash.',
      }),
    ),
    hasConflict: optional(
      boolean({
        typeComment:
          'Cached outcome of the last conflict check, valid only while conflictCheckedAgainstHash matches the registry hash.',
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
    /**
     * The version of the registry meta.
     */
    version: string
    /**
     * Last known commit hash of this document.
     *
     * Is going to be used to track if the document has been modified since it was last saved.
     */
    commitHash?: string
    /**
     * Registry commit hash that the cached `hasConflict` flag was computed
     * against. The cache is invalid when this no longer matches the registry
     * hash advertised for this version.
     */
    conflictCheckedAgainstHash?: string
    /**
     * Cached outcome of the last conflict check, valid only while
     * `conflictCheckedAgainstHash` matches the registry's current hash for
     * this version.
     */
    hasConflict?: boolean
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
