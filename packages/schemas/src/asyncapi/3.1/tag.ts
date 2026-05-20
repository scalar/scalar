import { array, object, optional, string } from '@scalar/validation'

import { createAsyncApiExternalDocumentationObject } from './external-documentation'
import { type MaybeRefFn, normalRef } from './reference'

/**
 * Builds Tag-related schemas for {@link generateSchema}.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 * @returns `tagObject` — **Reference union** (`Tag Object | Reference Object`). Do not wrap again.
 * @returns `tagsObject` — Array of the same union (each item may be inline or `$ref`).
 */
export const createAsyncApiTagSchemas = (maybeRef: MaybeRefFn) => {
  const externalDocumentation = createAsyncApiExternalDocumentationObject(maybeRef)

  const tagObject = maybeRef(
    object(
      {
        name: string({ typeComment: 'REQUIRED. The name of the tag.' }),
        description: optional(
          string({
            typeComment: 'A short description for the tag. CommonMark syntax MAY be used for rich text representation.',
          }),
        ),
        externalDocs: optional(externalDocumentation),
      },
      { typeName: 'AsyncApiTagObject' },
    ),
  )

  const tagsObject = array(tagObject, {
    typeName: 'AsyncApiTagsObject',
    typeComment: 'A list of Tag Objects (entries MAY be Reference Objects).',
  })

  return { tagObject, tagsObject }
}

const defaultTagSchemas = createAsyncApiTagSchemas(normalRef)

export const asyncApiTagObject = defaultTagSchemas.tagObject
export const asyncApiTagsObject = defaultTagSchemas.tagsObject
