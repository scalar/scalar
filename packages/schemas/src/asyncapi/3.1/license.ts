import { object, optional, string } from '@scalar/validation'

import { type MaybeRefFn, normalRef } from './reference'

const asyncApiLicenseObjectInner = object(
  {
    name: string({ typeComment: 'REQUIRED. The license name used for the API.' }),
    url: optional(
      string({
        typeComment: 'A URL to the license used for the API. This MUST be in the form of an absolute URL.',
      }),
    ),
  },
  { typeName: 'AsyncApiLicenseObject' },
)

/**
 * Builds the License Object schema for {@link generateSchema}.
 *
 * **Reference union:** Returns `License Object | Reference Object`. Do not wrap the result in
 * `maybeRef` again at the call site.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createAsyncApiLicenseObject = (maybeRef: MaybeRefFn) => maybeRef(asyncApiLicenseObjectInner)

export const asyncApiLicenseObject = createAsyncApiLicenseObject(normalRef)
