import {
  type Schema,
  any,
  boolean,
  intersection,
  lazy,
  object,
  optional,
  record,
  string,
  union,
} from '@scalar/validation'

import { openApiExampleObject } from './example'
import { type MaybeRefFn, normalRef } from './reference'
import { openApiSchemaObject } from './schema'

/**
 * Builds Media Type, Header, and Encoding schemas for {@link createOpenApiDocumentSchema}.
 *
 * Header and Media Type reference each other; they are defined together so `lazy` can break the cycle.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createOpenApiMediaTypeSchemas = (maybeRef: MaybeRefFn) => {
  const headerBase = object(
    {
      description: optional(
        string({
          typeComment:
            'A brief description of the header. This could contain examples of use. CommonMark syntax MAY be used for rich text representation.',
        }),
      ),
      required: optional(
        boolean({ typeComment: 'Determines whether this header is mandatory. The default value is false.' }),
      ),
      deprecated: optional(
        boolean({
          typeComment:
            'Specifies that the header is deprecated and SHOULD be transitioned out of usage. Default value is false.',
        }),
      ),
    },
    { typeName: 'HeaderBase' },
  )

  let headerObject: Schema

  const encodingObject = object(
    {
      contentType: optional(
        string({
          typeComment:
            'The Content-Type for encoding a specific property. The value is a comma-separated list, each element of which is either a specific media type (e.g. image/png) or a wildcard media type (e.g. image/*).',
        }),
      ),
      headers: optional(record(string(), maybeRef(lazy(() => headerObject)), { typeName: 'EncodingHeaders' })),
    },
    { typeName: 'EncodingObject' },
  )

  const mediaTypeObject: Schema = lazy(() =>
    object(
      {
        schema: optional(maybeRef(lazy(() => openApiSchemaObject))),
        example: optional(any({ typeComment: 'Example of the media type.' })),
        examples: optional(
          record(string(), maybeRef(lazy(() => openApiExampleObject)), { typeName: 'MediaTypeExamples' }),
        ),
        encoding: optional(
          record(string(), encodingObject, {
            typeComment:
              'A map between a property name and its encoding information. The key, being the property name, MUST exist in the schema as a property.',
            typeName: 'MediaTypeEncoding',
          }),
        ),
      },
      { typeName: 'MediaTypeObject' },
    ),
  )

  const headerWithSchema: Schema = intersection([
    headerBase,
    object(
      {
        style: optional(
          string({
            typeComment:
              'Describes how the header value will be serialized. The default (and only legal value for headers) is "simple".',
          }),
        ),
        explode: optional(
          boolean({
            typeComment:
              'When this is true, header values of type array or object generate a single header whose value is a comma-separated list of the array items or key-value pairs of the map, see Style Examples.',
          }),
        ),
        schema: optional(maybeRef(lazy(() => openApiSchemaObject))),
        example: optional(any()),
        examples: optional(
          record(string(), maybeRef(lazy(() => openApiExampleObject)), { typeName: 'HeaderExamples' }),
        ),
      },
      { typeName: 'HeaderObjectWithSchema' },
    ),
  ])

  const headerWithContent: Schema = intersection([
    headerBase,
    object(
      {
        content: optional(
          record(
            string(),
            lazy(() => mediaTypeObject),
            {
              typeName: 'HeaderContent',
            },
          ),
        ),
      },
      { typeName: 'HeaderObjectWithContent' },
    ),
  ])

  headerObject = union([headerWithSchema, headerWithContent], { typeName: 'HeaderObject' })

  return { mediaTypeObject, headerObject, encodingObject }
}

const defaultMediaTypeSchemas = createOpenApiMediaTypeSchemas(normalRef)

export const openApiMediaTypeObject = defaultMediaTypeSchemas.mediaTypeObject
export const openApiHeaderObject = defaultMediaTypeSchemas.headerObject
export const openApiEncodingObject = defaultMediaTypeSchemas.encodingObject
