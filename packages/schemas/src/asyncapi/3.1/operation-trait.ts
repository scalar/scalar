import { array, object, optional, string } from '@scalar/validation'

import { asyncApiOperationBindingsObject } from './bindings'
import { createAsyncApiExternalDocumentationObject } from './external-documentation'
import { type MaybeRefFn, normalRef } from './reference'
import { createAsyncApiSecuritySchemeObject } from './security-scheme'
import { createAsyncApiTagSchemas } from './tag'

/**
 * Builds the Operation Trait Object schema for {@link generateSchema}.
 *
 * **Reference union:** Returns `Operation Trait Object | Reference Object`. Do not wrap the
 * return value in `maybeRef` again.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createAsyncApiOperationTraitObject = (maybeRef: MaybeRefFn) => {
  const externalDocumentation = createAsyncApiExternalDocumentationObject(maybeRef)
  const securityScheme = createAsyncApiSecuritySchemeObject(maybeRef)
  const { tagsObject } = createAsyncApiTagSchemas(maybeRef)

  return maybeRef(
    object(
      {
        title: optional(string({ typeComment: 'A human-friendly title for the operation.' })),
        summary: optional(string({ typeComment: 'A short summary of what the operation is about.' })),
        description: optional(
          string({
            typeComment:
              'A verbose explanation of the operation. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        security: optional(
          array(securityScheme, {
            typeComment:
              'Security schemes for this operation. Only one of the security scheme objects MUST be satisfied.',
          }),
        ),
        tags: optional(tagsObject),
        externalDocs: optional(externalDocumentation),
        bindings: optional(maybeRef(asyncApiOperationBindingsObject)),
      },
      { typeName: 'AsyncApiOperationTraitObject' },
    ),
  )
}

export const asyncApiOperationTraitObject = createAsyncApiOperationTraitObject(normalRef)
