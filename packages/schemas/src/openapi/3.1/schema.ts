import {
  type Schema,
  any,
  array,
  boolean,
  intersection,
  lazy,
  literal,
  number,
  object,
  optional,
  record,
  string,
  union,
} from '@scalar/validation'

import { XInternal, XScalarIgnore, XTags } from '@/extensions/document'
import { XAdditionalPropertiesName, XEnumDescriptions, XEnumVarNames, XExamples, XVariable } from '@/extensions/schema'

import { openApiDiscriminatorObject } from './discriminator'
import { openApiExternalDocumentationObject } from './external-documentation'
import { normalRef } from './reference'
import { openApiXmlObject } from './xml'

const schemaExtensionObjects = [
  XScalarIgnore,
  XInternal,
  XVariable,
  XExamples,
  XEnumDescriptions,
  XEnumVarNames,
  XAdditionalPropertiesName,
  XTags,
] as const

/**
 * Builds the Schema Object for {@link createOpenApiDocumentSchema}.
 *
 * **Not a reference union:** The schema shape itself is always inline. Nested schema keywords
 * (`properties`, `items`, combinators) use `maybeRef` where the specification allows `$ref`.
 *
 * @param maybeRef - `normalRef` or `recursiveRef` from `./reference`.
 */
export const createOpenApiSchemaObject = (): Schema => {
  const coreSchemaProperties = object({
    name: optional(string({ typeComment: 'Schema name (extension).' })),
    title: optional(string({ typeComment: 'A title for the schema.' })),
    description: optional(string({ typeComment: 'A description of the schema.' })),
    default: optional(any({ typeComment: 'Default value for the schema.' })),
    enum: optional(array(any(), { typeComment: 'Array of allowed values.', typeName: 'JsonSchemaEnum' })),
    const: optional(any({ typeComment: 'Constant value that must match exactly.' })),
    contentMediaType: optional(string({ typeComment: 'Media type for content validation.' })),
    contentEncoding: optional(string({ typeComment: 'Content encoding.' })),
    contentSchema: optional(normalRef(lazy(() => schemaObject))),
    deprecated: optional(boolean({ typeComment: 'Whether the schema is deprecated.' })),
    discriminator: optional(openApiDiscriminatorObject),
    readOnly: optional(boolean({ typeComment: 'Whether the schema is read-only.' })),
    writeOnly: optional(boolean({ typeComment: 'Whether the schema is write-only.' })),
    xml: optional(openApiXmlObject),
    externalDocs: optional(openApiExternalDocumentationObject),
    example: optional(
      any({
        typeComment:
          'A free-form field to include an example of an instance for this schema. Deprecated in favor of the JSON Schema examples keyword.',
      }),
    ),
    examples: optional(
      array(any(), {
        typeComment:
          'An array of examples of valid instances for this schema. This keyword follows the JSON Schema Draft 2020-12 specification.',
        typeName: 'SchemaExamplesArray',
      }),
    ),
    allOf: optional(array(normalRef(lazy(() => schemaObject)), { typeName: 'SchemaObjectAllOf' })),
    oneOf: optional(array(normalRef(lazy(() => schemaObject)), { typeName: 'SchemaObjectOneOf' })),
    anyOf: optional(array(normalRef(lazy(() => schemaObject)), { typeName: 'SchemaObjectAnyOf' })),
    not: optional(normalRef(lazy(() => schemaObject))),
  })

  const numericSchema: Schema = object(
    {
      type: union([literal('number'), literal('integer')]),
      format: optional(string({ typeComment: 'Different subtypes.' })),
      multipleOf: optional(number({ typeComment: 'Number must be a multiple of this value.' })),
      maximum: optional(number({ typeComment: 'Maximum value (inclusive).' })),
      exclusiveMaximum: optional(number({ typeComment: 'Maximum value (exclusive).' })),
      minimum: optional(number({ typeComment: 'Minimum value (inclusive).' })),
      exclusiveMinimum: optional(number({ typeComment: 'Minimum value (exclusive).' })),
    },
    { typeName: 'NumberSchemaObject' },
  )

  const stringSchema = object(
    {
      type: literal('string'),
      format: optional(string({ typeComment: 'Different subtypes.' })),
      maxLength: optional(number({ typeComment: 'Maximum string length.' })),
      minLength: optional(number({ typeComment: 'Minimum string length.' })),
      pattern: optional(string({ typeComment: 'Regular expression pattern.' })),
    },
    { typeName: 'StringSchemaObject' },
  )

  const objectSchema = object(
    {
      type: literal('object'),
      maxProperties: optional(number({ typeComment: 'Maximum number of properties.' })),
      minProperties: optional(number({ typeComment: 'Minimum number of properties.' })),
      properties: optional(
        record(string(), normalRef(lazy(() => schemaObject)), { typeName: 'SchemaObjectProperties' }),
      ),
      required: optional(array(string(), { typeName: 'SchemaObjectRequired' })),
      additionalProperties: optional(
        union([normalRef(lazy(() => schemaObject)), object({}), boolean()], {
          typeName: 'SchemaObjectAdditionalProperties',
        }),
      ),
      patternProperties: optional(
        record(string(), normalRef(lazy(() => schemaObject)), { typeName: 'SchemaObjectPatternProperties' }),
      ),
      propertyNames: optional(normalRef(lazy(() => schemaObject))),
    },
    { typeName: 'ObjectSchemaObject' },
  )

  const arraySchema = object(
    {
      type: literal('array'),
      maxItems: optional(number({ typeComment: 'Maximum number of items in array.' })),
      minItems: optional(number({ typeComment: 'Minimum number of items in array.' })),
      uniqueItems: optional(boolean({ typeComment: 'Whether array items must be unique.' })),
      items: optional(normalRef(lazy(() => schemaObject))),
      prefixItems: optional(
        array(normalRef(lazy(() => schemaObject)), { typeComment: 'Schema for tuple validation.' }),
      ),
    },
    { typeName: 'ArraySchemaObject' },
  )

  const schemaTypeMulti = union(
    [
      literal('null'),
      literal('boolean'),
      literal('string'),
      literal('number'),
      literal('integer'),
      literal('object'),
      literal('array'),
    ],
    { typeName: 'SchemaObjectMultiTypeKeywords' },
  )

  const otherTypeSchema = object(
    {
      type: union([literal('null'), literal('boolean'), array(schemaTypeMulti)], {
        typeName: 'SchemaObjectOtherTypeKeyword',
      }),
    },
    { typeName: 'MultiTypeSchemaObject' },
  )

  const schemaObject: Schema = intersection(
    [
      coreSchemaProperties,
      ...schemaExtensionObjects,
      union([otherTypeSchema, numericSchema, stringSchema, objectSchema, arraySchema, object({})]),
    ],
    { typeName: 'SchemaObject' },
  )

  return schemaObject
}

export const openApiSchemaObject = createOpenApiSchemaObject()
