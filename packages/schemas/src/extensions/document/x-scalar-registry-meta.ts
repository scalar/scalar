import { boolean, object, optional, string } from '@scalar/validation'

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

export const XScalarRegistryMeta = object(
  {
    'x-scalar-registry-meta': optional(XScalarRegistryMetaInner),
  },
  {
    typeName: 'XScalarRegistryMeta',
    typeComment: 'The registry meta for the document',
  },
)
