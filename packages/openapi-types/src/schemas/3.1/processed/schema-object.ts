import { z } from 'zod'
import { DiscriminatorObjectSchema } from './discriminator-object'
import { ExternalDocumentationObjectSchema } from './external-documentation-object'
import { ReferenceObjectSchema } from './reference-object'
import { XmlObjectSchema } from './xml-object'

const StringFormats = z.enum([
  'date',
  'date-time',
  'duration',
  'password',
  'byte',
  'binary',
  'email',
  'uuid',
  'uri',
  'uri-reference',
  'uri-template',
  'hostname',
  'ipv4',
  'ipv6',
])

const NumberFormats = z.enum(['float', 'double', 'int32', 'int64'])

/**
 * The Schema Object allows the definition of input and output data types.
 * These types can be objects, but also primitives and arrays.
 */
export const SchemaObjectSchema: z.ZodType<any> = z.lazy(() =>
  z
    .object({
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
      properties: z.record(z.string(), z.union([z.lazy(() => SchemaObjectSchema), ReferenceObjectSchema])).optional(),
      additionalProperties: z.union([z.boolean(), z.lazy(() => SchemaObjectSchema), ReferenceObjectSchema]).optional(),
      patternProperties: z
        .record(z.string(), z.union([z.lazy(() => SchemaObjectSchema), ReferenceObjectSchema]))
        .optional(),

      // Array-related fields
      items: z.union([z.lazy(() => SchemaObjectSchema), ReferenceObjectSchema]).optional(),
      prefixItems: z.array(z.union([z.lazy(() => SchemaObjectSchema), ReferenceObjectSchema])).optional(),

      // Composition-related fields
      allOf: z.array(z.union([z.lazy(() => SchemaObjectSchema), ReferenceObjectSchema])).optional(),
      oneOf: z.array(z.union([z.lazy(() => SchemaObjectSchema), ReferenceObjectSchema])).optional(),
      anyOf: z.array(z.union([z.lazy(() => SchemaObjectSchema), ReferenceObjectSchema])).optional(),
      not: z.union([z.lazy(() => SchemaObjectSchema), ReferenceObjectSchema]).optional(),

      // Discriminator (only valid with oneOf, anyOf, or allOf)
      discriminator: DiscriminatorObjectSchema.optional(),

      // Additional metadata
      externalDocs: ExternalDocumentationObjectSchema.optional(),
      xml: XmlObjectSchema.optional(),
    })
    .passthrough() // Allow vendor extensions
    .superRefine((schema, ctx) => {
      // Array type must have items
      if (schema.type === 'array' || (Array.isArray(schema.type) && schema.type.includes('array'))) {
        if (schema.items === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'items must be present when type is array',
            path: ['items'],
          })
        }
      }

      // Numeric validations only for numeric types
      const isNumeric =
        schema.type === 'number' ||
        schema.type === 'integer' ||
        (Array.isArray(schema.type) && (schema.type.includes('number') || schema.type.includes('integer')))
      const numericValidations = ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf']
      numericValidations.forEach((prop) => {
        if (schema[prop] !== undefined && !isNumeric) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${prop} can only be used with numeric types`,
            path: [prop],
          })
        }
      })

      // String validations only for string type
      const isString = schema.type === 'string' || (Array.isArray(schema.type) && schema.type.includes('string'))
      const stringValidations = ['minLength', 'maxLength', 'pattern']
      stringValidations.forEach((prop) => {
        if (schema[prop] !== undefined && !isString) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${prop} can only be used with string type`,
            path: [prop],
          })
        }
      })

      // Array validations only for array type
      const isArray = schema.type === 'array' || (Array.isArray(schema.type) && schema.type.includes('array'))
      const arrayValidations = ['minItems', 'maxItems', 'uniqueItems']
      arrayValidations.forEach((prop) => {
        if (schema[prop] !== undefined && !isArray) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${prop} can only be used with array type`,
            path: [prop],
          })
        }
      })

      // Object validations only for object type
      const isObject = schema.type === 'object' || (Array.isArray(schema.type) && schema.type.includes('object'))
      const objectValidations = ['minProperties', 'maxProperties']
      objectValidations.forEach((prop) => {
        if (schema[prop] !== undefined && !isObject) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${prop} can only be used with object type`,
            path: [prop],
          })
        }
      })

      // Validate numeric constraints
      if (schema.multipleOf !== undefined && (typeof schema.multipleOf !== 'number' || schema.multipleOf <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'multipleOf must be a positive number',
          path: ['multipleOf'],
        })
      }

      if (schema.minimum !== undefined && typeof schema.minimum !== 'number') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'minimum must be a number',
          path: ['minimum'],
        })
      }

      if (schema.maximum !== undefined && typeof schema.maximum !== 'number') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'maximum must be a number',
          path: ['maximum'],
        })
      }

      if (
        schema.exclusiveMinimum !== undefined &&
        typeof schema.exclusiveMinimum !== 'number' &&
        typeof schema.exclusiveMinimum !== 'boolean'
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'exclusiveMinimum must be a number or boolean',
          path: ['exclusiveMinimum'],
        })
      }

      if (
        schema.exclusiveMaximum !== undefined &&
        typeof schema.exclusiveMaximum !== 'number' &&
        typeof schema.exclusiveMaximum !== 'boolean'
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'exclusiveMaximum must be a number or boolean',
          path: ['exclusiveMaximum'],
        })
      }

      // Format validation
      if (schema.format) {
        const isValidStringFormat = StringFormats.safeParse(schema.format).success
        const isValidNumberFormat = NumberFormats.safeParse(schema.format).success

        // Only validate format compatibility if a type is specified
        if (schema.type) {
          if (isValidStringFormat && !isString) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `format ${schema.format} can only be used with string type`,
              path: ['format'],
            })
          }

          if (isValidNumberFormat && !isNumeric) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `format ${schema.format} can only be used with number or integer type`,
              path: ['format'],
            })
          }
        }

        if (!isValidStringFormat && !isValidNumberFormat) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `invalid format: ${schema.format}`,
            path: ['format'],
          })
        }
      }

      // readOnly and writeOnly cannot both be true
      if (schema.readOnly === true && schema.writeOnly === true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'readOnly and writeOnly cannot both be true',
          path: ['readOnly'],
        })
      }

      // Discriminator validation
      if (schema.discriminator) {
        if (!schema.required?.includes(schema.discriminator.propertyName)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'discriminator propertyName must be listed in required array',
            path: ['discriminator', 'propertyName'],
          })
        }
      }
    }),
)

export interface SchemaObject extends z.infer<typeof SchemaObjectSchema> {}
