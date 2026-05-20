import { object, optional, string } from '@scalar/validation'

import { type MaybeRefFn, normalRef } from './reference'

const asyncApiExternalDocumentationObjectInner = object(
  {
    description: optional(
      string({
        typeComment:
          'A short description of the target documentation. CommonMark syntax MAY be used for rich text representation.',
      }),
    ),
    url: string({
      typeComment: 'REQUIRED. The URL for the target documentation. This MUST be in the form of an absolute URL.',
    }),
  },
  { typeName: 'AsyncApiExternalDocumentationObject' },
)

/**
 * Builds the External Documentation Object schema for {@link generateSchema}.
 *
 * **Reference union:** Returns `External Documentation Object | Reference Object`. The
 * specification allows `$ref` for this shape; `maybeRef` applies the union once here. Do not
 * wrap the result in `maybeRef` again at the call site.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createAsyncApiExternalDocumentationObject = (maybeRef: MaybeRefFn) =>
  maybeRef(asyncApiExternalDocumentationObjectInner)

export const asyncApiExternalDocumentationObject = createAsyncApiExternalDocumentationObject(normalRef)
