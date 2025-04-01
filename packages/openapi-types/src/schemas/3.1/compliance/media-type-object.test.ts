import { describe, expect, it } from 'vitest'

import { MediaTypeObjectSchema } from '../unprocessed/media-type-object'

describe('media-type-object', () => {
  describe('MediaTypeObject', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#media-type-examples
    it('Media Type Examples', () => {
      const result = MediaTypeObjectSchema.parse({
        schema: {
          $ref: '#/components/schemas/Pet',
        },
        examples: {
          cat: {
            summary: 'An example of a cat',
            value: {
              name: 'Fluffy',
              petType: 'Cat',
              color: 'White',
              gender: 'male',
              breed: 'Persian',
            },
          },
          dog: {
            summary: "An example of a dog with a cat's name",
            value: {
              name: 'Puma',
              petType: 'Dog',
              color: 'Black',
              gender: 'Female',
              breed: 'Mixed',
            },
          },
          frog: {
            $ref: '#/components/examples/frog-example',
          },
        },
      })

      expect(result).toEqual({
        schema: {
          $ref: '#/components/schemas/Pet',
        },
        examples: {
          cat: {
            summary: 'An example of a cat',
            value: {
              name: 'Fluffy',
              petType: 'Cat',
              color: 'White',
              gender: 'male',
              breed: 'Persian',
            },
          },
          dog: {
            summary: "An example of a dog with a cat's name",
            value: {
              name: 'Puma',
              petType: 'Dog',
              color: 'Black',
              gender: 'Female',
              breed: 'Mixed',
            },
          },
          frog: {
            $ref: '#/components/examples/frog-example',
          },
        },
      })
    })
  })
})
