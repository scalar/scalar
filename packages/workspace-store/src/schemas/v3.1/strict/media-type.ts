import { Type, type TSchema } from '@sinclair/typebox'
import { ExtensionsSchema } from '@/schemas/v3.1/strict/extensions'
import { ExampleObjectSchema } from '@/schemas/v3.1/strict/example'
import { ReferenceObjectSchema } from '@/schemas/v3.1/strict/reference'
import { compose } from '@/schemas/v3.1/compose'
import { SchemaObjectSchema } from '@/schemas/v3.1/strict/schema'

export const mediaTypeObjectSchemaBuilder = <E extends TSchema>(encoding: E) =>
  // @ts-ignore
  compose(
    Type.Object({
      /** The schema defining the content of the request, response, parameter, or header. */
      // @ts-ignore
      schema: Type.Optional(SchemaObjectSchema),
      /** Example of the media type */
      example: Type.Optional(Type.Any()),
      /** Examples of the media type */
      examples: Type.Optional(Type.Record(Type.String(), Type.Union([ExampleObjectSchema, ReferenceObjectSchema]))),
      /** A map between a property name and its encoding information. The key, being the property name, MUST exist in the schema as a property. The encoding field SHALL only apply to Request Body Objects, and only when the media type is multipart or application/x-www-form-urlencoded. If no Encoding Object is provided for a property, the behavior is determined by the default values documented for the Encoding Object. */
      encoding: Type.Optional(Type.Record(Type.String(), encoding)),
    }),
    ExtensionsSchema,
  )
