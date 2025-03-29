import { z } from 'zod'
import { DiscriminatorObjectSchema } from './discriminator-object'
import { ExternalDocumentationObjectSchema } from './external-documentation-object'
import { XmlObjectSchema } from './xml-object'

/**
 * The Schema Object allows the definition of input and output data types.
 * These types can be objects, but also primitives and arrays.
 */
export const SchemaObjectSchema: z.ZodType<Record<string, any>> = z.object({
  // Standard JSON Schema fields
  title: z.string().optional(),
  description: z.string().optional(),
  default: z.any().optional(),
  examples: z.array(z.any()).optional(),
  multipleOf: z.number().optional(),
  maximum: z.number().optional(),
  exclusiveMaximum: z.union([z.boolean(), z.number()]).optional(),
  minimum: z.number().optional(),
  exclusiveMinimum: z.union([z.boolean(), z.number()]).optional(),
  maxLength: z.number().int().optional(),
  minLength: z.number().int().optional(),
  pattern: z.string().optional(),
  maxItems: z.number().int().optional(),
  minItems: z.number().int().optional(),
  uniqueItems: z.boolean().optional(),
  maxProperties: z.number().int().optional(),
  minProperties: z.number().int().optional(),
  required: z.array(z.string()).optional(),
  enum: z.array(z.any()).optional(),
  type: z
    .union([
      z.literal('array'),
      z.literal('boolean'),
      z.literal('integer'),
      z.literal('number'),
      z.literal('object'),
      z.literal('string'),
      z.literal('null'),
      z.array(
        z.union([
          z.literal('array'),
          z.literal('boolean'),
          z.literal('integer'),
          z.literal('number'),
          z.literal('object'),
          z.literal('string'),
          z.literal('null'),
        ]),
      ),
    ])
    .optional(),

  // JSON Schema fields
  $ref: z.string().optional(),
  $id: z.string().optional(),
  $schema: z.string().optional(),
  $defs: z.record(z.lazy(() => SchemaObjectSchema)).optional(),
  const: z.any().optional(),
  $dynamicRef: z.string().optional(),
  $dynamicAnchor: z.string().optional(),

  // OpenAPI specific fields
  format: z.string().optional(),
  contentMediaType: z.string().optional(),
  contentEncoding: z.string().optional(),
  contentSchema: z.lazy(() => SchemaObjectSchema).optional(),
  deprecated: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  writeOnly: z.boolean().optional(),
  example: z.any().optional(),

  // Object-related fields
  properties: z
    .record(
      z.string(),
      z.lazy(() => SchemaObjectSchema),
    )
    .optional(),
  additionalProperties: z.union([z.boolean(), z.lazy(() => SchemaObjectSchema)]).optional(),
  patternProperties: z
    .record(
      z.string(),
      z.lazy(() => SchemaObjectSchema),
    )
    .optional(),

  // Array-related fields
  items: z.lazy(() => SchemaObjectSchema).optional(),
  prefixItems: z.array(z.lazy(() => SchemaObjectSchema)).optional(),

  // Composition-related fields
  allOf: z.array(z.lazy(() => SchemaObjectSchema)).optional(),
  oneOf: z.array(z.lazy(() => SchemaObjectSchema)).optional(),
  anyOf: z.array(z.lazy(() => SchemaObjectSchema)).optional(),
  not: z.lazy(() => SchemaObjectSchema).optional(),

  // Discriminator (only valid with oneOf, anyOf, or allOf)
  discriminator: DiscriminatorObjectSchema.optional(),

  // Additional metadata
  externalDocs: ExternalDocumentationObjectSchema.optional(),
  xml: XmlObjectSchema.optional(),
})

export type SchemaObject = z.infer<typeof SchemaObjectSchema>
