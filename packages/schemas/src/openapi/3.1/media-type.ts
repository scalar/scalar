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

import { example } from '@/openapi/3.1/example'
import { normalRef, recursiveRef } from '@/openapi/3.1/reference'
import { schema } from '@/openapi/3.1/schema'

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
      schema: optional(normalRef(lazy(() => schema))),
      example: optional(any()),
      examples: optional(record(string(), recursiveRef(lazy(() => example)), { typeName: 'HeaderExamples' })),
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
          lazy(() => mediaType),
          { typeName: 'HeaderContent' },
        ),
      ),
    },
    { typeName: 'HeaderObjectWithContent' },
  ),
])

export const header = union([headerWithSchema, headerWithContent], { typeName: 'HeaderObject' })

export const encoding = object(
  {
    contentType: optional(
      string({
        typeComment:
          'The Content-Type for encoding a specific property. The value is a comma-separated list, each element of which is either a specific media type (e.g. image/png) or a wildcard media type (e.g. image/*).',
      }),
    ),
    headers: optional(record(string(), recursiveRef(lazy(() => header)), { typeName: 'EncodingHeaders' })),
  },
  { typeName: 'EncodingObject' },
)

export const mediaType = object(
  {
    schema: optional(normalRef(lazy(() => schema))),
    example: optional(any({ typeComment: 'Example of the media type.' })),
    examples: optional(record(string(), recursiveRef(lazy(() => example)), { typeName: 'MediaTypeExamples' })),
    encoding: optional(
      record(string(), encoding, {
        typeComment:
          'A map between a property name and its encoding information. The key, being the property name, MUST exist in the schema as a property.',
        typeName: 'MediaTypeEncoding',
      }),
    ),
  },
  { typeName: 'MediaTypeObject' },
)
