import { isTypeAliasDeclaration } from 'typescript'
import { describe, expect, it } from 'vitest'

import { fileNameResolver, program } from './test-setup'
import { getSchemaFromTypeNode } from './type-nodes'

describe('getSchemaFromTypeNode', () => {
  const sourceFile = program.getSourceFile(__dirname + '/fixtures/testing-types.ts')
  // Just hard coded, change this if we add/remove in the testing types file
  const type = sourceFile?.statements[2]

  if (type && isTypeAliasDeclaration(type)) {
    const schema = getSchemaFromTypeNode(type.type, program, fileNameResolver)

    // TODO: these need to be added still, left the unknown types to have the tests passing

    it('should not handle an undefined type', () =>
      expect(schema.properties!['Undefined']!).toEqual({
        type: 'null',
        description: 'TODO this type is not handled yet: UndefinedKeyword',
      }))

    it('should handle a type query', () =>
      expect(schema.properties!['typeQuery']).toEqual({
        type: 'null',
        description: 'TODO this type is not handled yet: TypeQuery',
      }))

    // TODO: END unknowns

    it('should handle a null type', () =>
      expect(schema.properties!['Null']!).toEqual({
        type: 'null',
        example: null,
      }))

    it('should handle a boolean type', () =>
      expect(schema.properties!['Boolean']!).toEqual({
        type: 'boolean',
      }))

    it('should handle a boolean literal', () =>
      expect(schema.properties!['boolLiteral']).toEqual({
        type: 'boolean',
        example: false,
      }))

    it('should handle a number type', () =>
      expect(schema.properties!['Number']).toEqual({
        type: 'number',
      }))

    it('should handle a number literal', () =>
      expect(schema.properties!['numerLiteral']).toEqual({
        type: 'number',
        example: 38,
      }))

    it('should handle a bigint type', () =>
      expect(schema.properties!['BigInt']).toEqual({
        type: 'integer',
      }))

    it('should handle a bigint literal', () =>
      expect(schema.properties!['bigIntLiteral']).toEqual({
        type: 'integer',
        example: '546515156165156424n',
      }))

    it('should handle a string type', () =>
      expect(schema.properties!['String']).toEqual({
        type: 'string',
      }))

    it('should handle a string literal', () =>
      expect(schema.properties!['stringLiteral']).toEqual({
        type: 'string',
        example: 'Literally a string value',
      }))

    it('should handle an object type', () =>
      expect(schema.properties!['Object']).toEqual({
        type: 'object',
      }))

    it('should handle an object literal', () =>
      expect(schema.properties!['objectLiteral']).toEqual({
        type: 'object',
        properties: {
          bool: {
            type: 'boolean',
            example: true,
          },
          num: {
            type: 'number',
            example: 123,
          },
          boolType: {
            type: 'boolean',
          },
          numType: {
            type: 'number',
          },
          stringer: {
            type: 'string',
            example: 'who',
          },
        },
      }))

    it('should handle an any type', () =>
      expect(schema.properties!['Any']).toEqual({
        anyOf: [
          {
            type: 'string',
          },
          {
            type: 'number',
          },
          {
            type: 'integer',
          },
          {
            type: 'boolean',
          },
          {
            type: 'object',
          },
          {
            type: 'array',
            items: {},
          },
        ],
      }))

    it('should handle an array of any types', () =>
      expect(schema.properties!['ArrayAny']).toEqual({
        type: 'array',
        items: {
          anyOf: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
            {
              type: 'integer',
            },
            {
              type: 'boolean',
            },
            {
              type: 'object',
            },
            {
              type: 'array',
              items: {},
            },
          ],
        },
      }))

    it('should handle an array of any type references', () =>
      expect(schema.properties!['ArrayAnyTypeReference']).toEqual({
        type: 'array',
        items: {
          anyOf: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
            {
              type: 'integer',
            },
            {
              type: 'boolean',
            },
            {
              type: 'object',
            },
            {
              type: 'array',
              items: {},
            },
          ],
        },
      }))

    it('should handle an array of strings', () =>
      expect(schema.properties!['ArrayString']).toEqual({
        type: 'array',
        items: { type: 'string' },
      }))

    //  "RecordAny": {
    //   "type": "null",
    //   "description": "TODO this type is not handled yet: TypeReference"
    // },
    // "RecordNumber": {
    //   "type": "null",
    //   "description": "TODO this type is not handled yet: TypeReference"
    // },
    // "date": {
    //   "type": "null",
    //   "description": "TODO this type is not handled yet: TypeReference"
    // },
    // "int8Array": {
    //   "type": "null",
    //   "description": "TODO this type is not handled yet: TypeReference"
    // },
    // "uInt8Array": {
    //   "type": "null",
    //   "description": "TODO this type is not handled yet: TypeReference"
    // },
    // "UInt8ClampedArray": {
    //   "type": "null",
    //   "description": "TODO this type is not handled yet: TypeReference"
    // },
    // "int16Array": {
    //   "type": "null",
    //   "description": "TODO this type is not handled yet: TypeReference"
    // },
    // "uint16Array": {
    //   "type": "null",
    //   "description": "TODO this type is not handled yet: TypeReference"
    // },
    // "int32Array": {
    //   "type": "null",
    //   "description": "TODO this type is not handled yet: TypeReference"
    // },
    // "uint32Array": {
    //   "type": "null",
    //   "description": "TODO this type is not handled yet: TypeReference"
    // },
    // "float32Array": {
    //   "type": "null",
    //   "description": "TODO this type is not handled yet: TypeReference"
    // },
    // "float64Array": {
    //   "type": "null",
    //   "description": "TODO this type is not handled yet: TypeReference"
    // },
    // "error": {
    //   "type": "null",
    //   "description": "TODO this type is not handled yet: TypeReference"
    // },
    // "keyString": {
    //   "type": "object",
    //   "properties": {
    //     "type": "string",
    //     "description": "TODO this type is not handled yet: IndexSignature"
    //   }
    // },
    // "keyNumber": {
    //   "type": "object",
    //   "properties": {
    //     "type": "string",
    //     "description": "TODO this type is not handled yet: IndexSignature"
    //   }
    // },
    // "keySymbol": {
    //   "type": "object",
    //   "properties": {
    //     "type": "string",
    //     "description": "TODO this type is not handled yet: IndexSignature"
    //   }
    // },
    // "keyAB": {
    //   "type": "object",
    //   "properties": {
    //     "a": {
    //       "type": "number"
    //     },
    //     "b": {
    //       "type": "string"
    //     }
    //   }
    // },
    // "tupleMixed": {
    //   "type": "null",
    //   "description": "TODO this type is not handled yet: TupleType"
    // },

    it('should handle a union of numeric literals', () =>
      expect(schema.properties!['unionNumericLiteral']).toEqual({
        type: 'number',
        enum: [1, 2, 3],
      }))

    it('should handle a union of booleans', () =>
      expect(schema.properties!['unionBoolean']).toEqual({
        type: 'boolean',
        enum: [true, false],
      }))

    it('should handle a union of mixed types', () =>
      expect(schema.properties!['unionMixed']).toEqual({
        anyOf: [
          {
            type: 'string',
          },
          {
            type: 'number',
          },
          {
            type: 'boolean',
          },
        ],
      }))

    it('should handle an intersection type', () =>
      expect(schema.properties!['inersection']).toEqual({
        allOf: [
          {
            type: 'string',
          },
          {
            type: 'number',
          },
        ],
      }))

    it('should handle an optional type', () =>
      expect(schema.properties!['optional']).toEqual({
        type: 'object',
        properties: {
          a: {
            type: 'number',
          },
          b: {
            type: 'string',
          },
        },
      }))

    it('should handle a deep object', () =>
      expect(schema.properties!['deep']).toEqual({
        type: 'object',
        properties: {
          a: {
            type: 'object',
            properties: {
              b: {
                type: 'object',
                properties: {
                  c: {
                    type: 'number',
                  },
                },
              },
            },
          },
        },
      }))

    it('should handle a union of mixed types', () =>
      expect(schema.properties!['unionMixed']).toEqual({
        anyOf: [
          {
            type: 'string',
          },
          {
            type: 'number',
          },
          {
            type: 'boolean',
          },
        ],
      }))

    it('should handle a never type', () =>
      expect(schema.properties!['Never']).toEqual({
        type: 'null',
        description: 'TODO this type is not handled yet: NeverKeyword',
      }))
  }
})
