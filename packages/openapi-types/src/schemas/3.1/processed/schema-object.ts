import { z } from 'zod'

// Basic JSON Schema types
const JsonSchemaTypes = z.enum(['string', 'number', 'integer', 'boolean', 'array', 'object', 'null'])
const JsonSchemaType = z.union([JsonSchemaTypes, z.array(JsonSchemaTypes)])

// OpenAPI specific formats
const StringFormats = z.enum([
  // String formats
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
  // Number formats
  'float',
  'double',
  'int32',
  'int64',
])

// Define the Schema Object type structure
export interface SchemaObject {
  // Core type
  type?: z.infer<typeof JsonSchemaType>

  // Combining schemas
  allOf?: SchemaObject[]
  anyOf?: SchemaObject[]
  oneOf?: SchemaObject[]
  not?: SchemaObject

  // Object properties
  properties?: Record<string, SchemaObject>
  additionalProperties?: boolean | SchemaObject
  required?: string[]

  // Array items
  items?: SchemaObject

  // Constraints
  enum?: any[]
  const?: any

  // Numeric validations
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  multipleOf?: number

  // String validations
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: z.infer<typeof StringFormats>

  // Array validations
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean

  // Object validations
  minProperties?: number
  maxProperties?: number

  // Metadata
  title?: string
  description?: string
  default?: any
  deprecated?: boolean
  readOnly?: boolean
  writeOnly?: boolean
  example?: any

  // OpenAPI extensions
  discriminator?: {
    propertyName: string
    mapping?: Record<string, string>
  }
  xml?: {
    name?: string
    namespace?: string
    prefix?: string
    attribute?: boolean
    wrapped?: boolean
  }
  externalDocs?: {
    description?: string
    url: string
  }

  // Allow additional properties (for extensions)
  [key: string]: any
}

// The main Schema Object
// TODO: Comment
export const SchemaObjectSchema: z.ZodType<SchemaObject> = z.lazy(() =>
  z
    .object({
      // Core type
      type: JsonSchemaType.optional(),
      format: StringFormats.optional(),

      // Combining schemas
      allOf: z.array(z.lazy(() => SchemaObjectSchema)).optional(),
      anyOf: z.array(z.lazy(() => SchemaObjectSchema)).optional(),
      oneOf: z.array(z.lazy(() => SchemaObjectSchema)).optional(),
      not: z.lazy(() => SchemaObjectSchema).optional(),

      // Object properties
      properties: z
        .record(
          z.string(),
          z.lazy(() => SchemaObjectSchema),
        )
        .optional(),
      additionalProperties: z.union([z.boolean(), z.lazy(() => SchemaObjectSchema)]).optional(),
      required: z.array(z.string()).optional(),

      // Array items
      items: z.lazy(() => SchemaObjectSchema).optional(),

      // Constraints
      enum: z.array(z.any()).optional(),
      const: z.any().optional(),

      // Numeric validations
      minimum: z.number().optional(),
      maximum: z.number().optional(),
      exclusiveMinimum: z.number().optional(),
      exclusiveMaximum: z.number().optional(),
      multipleOf: z.number().positive().optional(),

      // String validations
      minLength: z.number().int().nonnegative().optional(),
      maxLength: z.number().int().nonnegative().optional(),
      pattern: z.string().optional(),

      // Array validations
      minItems: z.number().int().nonnegative().optional(),
      maxItems: z.number().int().nonnegative().optional(),
      uniqueItems: z.boolean().optional(),

      // Object validations
      minProperties: z.number().int().nonnegative().optional(),
      maxProperties: z.number().int().nonnegative().optional(),

      // Metadata
      title: z.string().optional(),
      description: z.string().optional(),
      default: z.any().optional(),
      deprecated: z.boolean().optional(),
      readOnly: z.boolean().optional(),
      writeOnly: z.boolean().optional(),
      example: z.any().optional(),

      // OpenAPI extensions
      discriminator: z
        .object({
          propertyName: z.string(),
          mapping: z.record(z.string(), z.string()).optional(),
        })
        .optional(),
      xml: z
        .object({
          name: z.string().optional(),
          namespace: z.string().optional(),
          prefix: z.string().optional(),
          attribute: z.boolean().optional(),
          wrapped: z.boolean().optional(),
        })
        .optional(),
      externalDocs: z
        .object({
          description: z.string().optional(),
          url: z.string(),
        })
        .optional(),
    })
    .passthrough()
    .superRefine((schema, ctx) => {
      // Validate that items is present when type is array
      if (schema.type === 'array' && !schema.items) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'items must be present when type is array',
          path: ['items'],
        })
      }

      // Validate that properties is an object when type is object
      if (schema.type === 'object' && schema.properties !== undefined && typeof schema.properties !== 'object') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'properties must be an object when specified',
          path: ['properties'],
        })
      }

      // Validate that numeric validations are only used with numeric types
      const numericValidations = ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf']
      if (schema.type && !['number', 'integer'].includes(schema.type as string)) {
        numericValidations.forEach((prop) => {
          if (schema[prop] !== undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${prop} can only be used with numeric types`,
              path: [prop],
            })
          }
        })
      }

      // Validate that string validations are only used with string type
      const stringValidations = ['minLength', 'maxLength', 'pattern']
      if (schema.type && schema.type !== 'string') {
        stringValidations.forEach((prop) => {
          if (schema[prop] !== undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${prop} can only be used with string type`,
              path: [prop],
            })
          }
        })
      }

      // Validate that array validations are only used with array type
      const arrayValidations = ['minItems', 'maxItems', 'uniqueItems']
      if (schema.type && schema.type !== 'array') {
        arrayValidations.forEach((prop) => {
          if (schema[prop] !== undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${prop} can only be used with array type`,
              path: [prop],
            })
          }
        })
      }

      // Validate that object validations are only used with object type
      const objectValidations = ['minProperties', 'maxProperties']
      if (schema.type && schema.type !== 'object') {
        objectValidations.forEach((prop) => {
          if (schema[prop] !== undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `${prop} can only be used with object type`,
              path: [prop],
            })
          }
        })
      }

      // Validate that readOnly and writeOnly are not both true
      if (schema.readOnly === true && schema.writeOnly === true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'readOnly and writeOnly cannot both be true',
          path: ['readOnly'],
        })
      }

      // Validate discriminator
      if (schema.discriminator) {
        // Validate that discriminator property is required
        if (!schema.required?.includes(schema.discriminator.propertyName)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'discriminator propertyName must be listed in required array',
            path: ['discriminator', 'propertyName'],
          })
        }
      }

      // Validate that format is only used with appropriate types
      if (schema.format) {
        const stringOnlyFormats = [
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
        ]
        const numberOnlyFormats = ['float', 'double', 'int32', 'int64']

        if (stringOnlyFormats.includes(schema.format) && schema.type !== 'string') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `format ${schema.format} can only be used with string type`,
            path: ['format'],
          })
        }

        if (numberOnlyFormats.includes(schema.format) && !['number', 'integer'].includes(schema.type as string)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `format ${schema.format} can only be used with number or integer type`,
            path: ['format'],
          })
        }
      }
    }),
)
