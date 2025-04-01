import { describe, expect, it } from 'vitest'

import { ComponentsObjectSchema } from '../unprocessed/components-object'
import { SchemaObjectSchema } from '../unprocessed/schema-object'

describe('schema-object', () => {
  describe('SchemaObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#schema-object-example
    describe('Schema Object Examples', () => {
      it('Primitive Example', () => {
        const result = SchemaObjectSchema.parse({
          type: 'string',
          format: 'email',
        })

        expect(result).toEqual({
          type: 'string',
          format: 'email',
        })
      })

      it('Simple Model', () => {
        const result = SchemaObjectSchema.parse({
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
            },
            address: {
              $ref: '#/components/schemas/Address',
            },
            age: {
              type: 'integer',
              format: 'int32',
              minimum: 0,
            },
          },
        })

        expect(result).toEqual({
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
            },
            address: {
              $ref: '#/components/schemas/Address',
            },
            age: {
              type: 'integer',
              format: 'int32',
              minimum: 0,
            },
          },
        })
      })

      describe('Model with Map/Dictionary Properties', () => {
        it('For a simple string to string mapping', () => {
          const result = SchemaObjectSchema.parse({
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
          })

          expect(result).toEqual({
            type: 'object',
            additionalProperties: {
              type: 'string',
            },
          })
        })

        it('For a string to model mapping', () => {
          const result = SchemaObjectSchema.parse({
            type: 'object',
            additionalProperties: {
              $ref: '#/components/schemas/ComplexModel',
            },
          })

          expect(result).toEqual({
            type: 'object',
            additionalProperties: {
              $ref: '#/components/schemas/ComplexModel',
            },
          })
        })
      })
    })

    it('Model with Annotated Enumeration', () => {
      const result = SchemaObjectSchema.parse({
        oneOf: [
          {
            const: 'RGB',
            title: 'Red, Green, Blue',
            description: 'Specify colors with the red, green, and blue additive color model',
          },
          {
            const: 'CMYK',
            title: 'Cyan, Magenta, Yellow, Black',
            description: 'Specify colors with the cyan, magenta, yellow, and black subtractive color model',
          },
        ],
      })

      expect(result).toEqual({
        oneOf: [
          {
            const: 'RGB',
            title: 'Red, Green, Blue',
            description: 'Specify colors with the red, green, and blue additive color model',
          },
          {
            const: 'CMYK',
            title: 'Cyan, Magenta, Yellow, Black',
            description: 'Specify colors with the cyan, magenta, yellow, and black subtractive color model',
          },
        ],
      })
    })

    it('Model with Example', () => {
      const result = SchemaObjectSchema.parse({
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
          },
          name: {
            type: 'string',
          },
        },
        required: ['name'],
        examples: [
          {
            name: 'Puma',
            id: 1,
          },
        ],
      })

      expect(result).toEqual({
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
          },
          name: {
            type: 'string',
          },
        },
        required: ['name'],
        examples: [
          {
            name: 'Puma',
            id: 1,
          },
        ],
      })
    })

    it('Models with Composition', () => {
      const result = ComponentsObjectSchema.parse({
        schemas: {
          ErrorModel: {
            type: 'object',
            required: ['message', 'code'],
            properties: {
              message: {
                type: 'string',
              },
              code: {
                type: 'integer',
                minimum: 100,
                maximum: 600,
              },
            },
          },
          ExtendedErrorModel: {
            allOf: [
              {
                $ref: '#/components/schemas/ErrorModel',
              },
              {
                type: 'object',
                required: ['rootCause'],
                properties: {
                  rootCause: {
                    type: 'string',
                  },
                },
              },
            ],
          },
        },
      })

      expect(result).toEqual({
        schemas: {
          ErrorModel: {
            type: 'object',
            required: ['message', 'code'],
            properties: {
              message: {
                type: 'string',
              },
              code: {
                type: 'integer',
                minimum: 100,
                maximum: 600,
              },
            },
          },
          ExtendedErrorModel: {
            allOf: [
              {
                $ref: '#/components/schemas/ErrorModel',
              },
              {
                type: 'object',
                required: ['rootCause'],
                properties: {
                  rootCause: {
                    type: 'string',
                  },
                },
              },
            ],
          },
        },
      })
    })

    it('Models with Polymorphism Support', () => {
      const result = ComponentsObjectSchema.parse({
        schemas: {
          Pet: {
            type: 'object',
            discriminator: {
              propertyName: 'petType',
            },
            properties: {
              name: {
                type: 'string',
              },
              petType: {
                type: 'string',
              },
            },
            required: ['name', 'petType'],
          },
          Cat: {
            description: 'A representation of a cat. Note that `Cat` will be used as the discriminating value.',
            allOf: [
              {
                $ref: '#/components/schemas/Pet',
              },
              {
                type: 'object',
                properties: {
                  huntingSkill: {
                    type: 'string',
                    description: 'The measured skill for hunting',
                    default: 'lazy',
                    enum: ['clueless', 'lazy', 'adventurous', 'aggressive'],
                  },
                },
                'required': ['huntingSkill'],
              },
            ],
          },
          Dog: {
            description: 'A representation of a dog. Note that `Dog` will be used as the discriminating value.',
            allOf: [
              {
                $ref: '#/components/schemas/Pet',
              },
              {
                type: 'object',
                properties: {
                  packSize: {
                    type: 'integer',
                    format: 'int32',
                    description: 'the size of the pack the dog is from',
                    default: 0,
                    'minimum': 0,
                  },
                },
                required: ['packSize'],
              },
            ],
          },
        },
      })

      expect(result).toEqual({
        schemas: {
          Pet: {
            type: 'object',
            discriminator: {
              propertyName: 'petType',
            },
            properties: {
              name: {
                type: 'string',
              },
              petType: {
                type: 'string',
              },
            },
            required: ['name', 'petType'],
          },
          Cat: {
            description: 'A representation of a cat. Note that `Cat` will be used as the discriminating value.',
            allOf: [
              {
                $ref: '#/components/schemas/Pet',
              },
              {
                type: 'object',
                properties: {
                  huntingSkill: {
                    type: 'string',
                    description: 'The measured skill for hunting',
                    default: 'lazy',
                    enum: ['clueless', 'lazy', 'adventurous', 'aggressive'],
                  },
                },
                'required': ['huntingSkill'],
              },
            ],
          },
          Dog: {
            description: 'A representation of a dog. Note that `Dog` will be used as the discriminating value.',
            allOf: [
              {
                $ref: '#/components/schemas/Pet',
              },
              {
                type: 'object',
                properties: {
                  packSize: {
                    type: 'integer',
                    format: 'int32',
                    description: 'the size of the pack the dog is from',
                    default: 0,
                    'minimum': 0,
                  },
                },
                required: ['packSize'],
              },
            ],
          },
        },
      })
    })

    it('Generic Data Structure Model', () => {
      const result = ComponentsObjectSchema.parse({
        schemas: {
          genericArrayComponent: {
            $id: 'fully_generic_array',
            type: 'array',
            items: {
              $dynamicRef: '#generic-array',
            },
            $defs: {
              allowAll: {
                $dynamicAnchor: 'generic-array',
              },
            },
          },
          numberArray: {
            $id: 'array_of_numbers',
            $ref: 'fully_generic_array',
            $defs: {
              numbersOnly: {
                '$dynamicAnchor': 'generic-array',
                'type': 'number',
              },
            },
          },
          stringArray: {
            $id: 'array_of_strings',
            $ref: 'fully_generic_array',
            $defs: {
              stringsOnly: {
                $dynamicAnchor: 'generic-array',
                type: 'string',
              },
            },
          },
          objWithTypedArray: {
            $id: 'obj_with_typed_array',
            type: 'object',
            required: ['dataType', 'data'],
            properties: {
              dataType: {
                enum: ['string', 'number'],
              },
            },
            oneOf: [
              {
                properties: {
                  dataType: { const: 'string' },
                  data: { $ref: 'array_of_strings' },
                },
              },
              {
                properties: {
                  dataType: { const: 'number' },
                  data: { $ref: 'array_of_numbers' },
                },
              },
            ],
          },
        },
      })

      expect(result).toEqual({
        schemas: {
          genericArrayComponent: {
            $id: 'fully_generic_array',
            type: 'array',
            items: {
              $dynamicRef: '#generic-array',
            },
            $defs: {
              allowAll: {
                $dynamicAnchor: 'generic-array',
              },
            },
          },
          numberArray: {
            $id: 'array_of_numbers',
            $ref: 'fully_generic_array',
            $defs: {
              numbersOnly: {
                '$dynamicAnchor': 'generic-array',
                'type': 'number',
              },
            },
          },
          stringArray: {
            $id: 'array_of_strings',
            $ref: 'fully_generic_array',
            $defs: {
              stringsOnly: {
                $dynamicAnchor: 'generic-array',
                type: 'string',
              },
            },
          },
          objWithTypedArray: {
            $id: 'obj_with_typed_array',
            type: 'object',
            required: ['dataType', 'data'],
            properties: {
              dataType: {
                enum: ['string', 'number'],
              },
            },
            oneOf: [
              {
                properties: {
                  dataType: { const: 'string' },
                  data: { $ref: 'array_of_strings' },
                },
              },
              {
                properties: {
                  dataType: { const: 'number' },
                  data: { $ref: 'array_of_numbers' },
                },
              },
            ],
          },
        },
      })
    })
  })
})
