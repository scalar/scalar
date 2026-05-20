import { object, optional, string } from '@scalar/validation'

import { asyncApiContactObject } from './contact'
import { createAsyncApiExternalDocumentationObject } from './external-documentation'
import { createAsyncApiLicenseObject } from './license'
import { type MaybeRefFn, normalRef } from './reference'
import { createAsyncApiTagSchemas } from './tag'

/**
 * Builds the Info Object schema for {@link generateSchema}.
 *
 * **Not a reference union:** The Info Object itself is always inline. Fields such as `license`,
 * `externalDocs`, and `tags` use schemas from other `create*` factories; those nested values are
 * already `Object | Reference Object` unions where the specification allows `$ref`.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createAsyncApiInfoObject = (maybeRef: MaybeRefFn) => {
  const license = createAsyncApiLicenseObject(maybeRef)
  const externalDocumentation = createAsyncApiExternalDocumentationObject(maybeRef)
  const { tagsObject } = createAsyncApiTagSchemas(maybeRef)

  return object(
    {
      title: string({ typeComment: 'REQUIRED. The title of the application.' }),
      version: string({
        typeComment:
          'REQUIRED. Provides the version of the application API (not to be confused with the AsyncAPI Specification version).',
      }),
      description: optional(
        string({
          typeComment:
            'A short description of the application. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      termsOfService: optional(string({ typeComment: 'A URL to the Terms of Service for the API (absolute URL).' })),
      contact: optional(asyncApiContactObject),
      license: optional(license),
      tags: optional(tagsObject),
      externalDocs: optional(externalDocumentation),
    },
    { typeName: 'AsyncApiInfoObject' },
  )
}

export const asyncApiInfoObject = createAsyncApiInfoObject(normalRef)
