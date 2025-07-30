import { describe, it, expect } from 'vitest'
import { schemaToExample } from './schema-to-example'

describe('schema-to-example', () => {
  describe('basic functionality', () => {
    it('returns undefined for undefined schema', () => {
      const result = schemaToExample(undefined)
      expect(result).toBeUndefined()
    })

    it('returns undefined when depth exceeds limit', () => {
      const schema = {
        type: 'object',
        properties: {
          nested: {
            type: 'object',
            properties: {
              deeper: {
                type: 'object',
                properties: {
                  evenDeeper: {
                    type: 'object',
                    properties: {
                      veryDeep: {
                        type: 'object',
                        properties: {
                          extremelyDeep: {
                            type: 'object',
                            properties: {
                              tooDeep: {
                                type: 'object',
                                properties: {
                                  beyondLimit: {
                                    type: 'object',
                                    properties: {
                                      final: {
                                        type: 'object',
                                        properties: {
                                          last: {
                                            type: 'object',
                                            properties: {
                                              end: {
                                                type: 'object',
                                                properties: {
                                                  stop: {
                                                    type: 'object',
                                                    properties: {
                                                      done: {
                                                        type: 'string',
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const result = schemaToExample(schema, 11)
      expect(result).toBeUndefined()
    })
  })

  describe('examples handling', () => {
    it('prioritizes examples array over example property', () => {
      const schema = {
        type: 'string',
        examples: ['from-array'],
        example: 'from-property',
      }

      const result = schemaToExample(schema)
      expect(result).toBe('from-array')
    })

    it('returns example property when examples array is empty', () => {
      const schema = {
        type: 'string',
        examples: [],
        example: 'single-example',
      }

      const result = schemaToExample(schema)
      expect(result).toBe('single-example')
    })

    it('handles complex examples in array', () => {
      const schema = {
        type: 'object',
        examples: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ],
      }

      const result = schemaToExample(schema)
      expect(result).toEqual({ name: 'John', age: 30 })
    })

    it('handles null example in array', () => {
      const schema = {
        type: 'string',
        examples: [null, 'valid-example'],
      }

      const result = schemaToExample(schema)
      expect(result).toBeNull()
    })
  })

  describe('primitive types', () => {
    it('returns appropriate default values for primitive types', () => {
      expect(schemaToExample({ type: 'string' })).toBe('')
      expect(schemaToExample({ type: 'string', format: 'date' })).toBe('1985-10-26')
      expect(schemaToExample({ type: 'string', format: 'date-time' })).toBe('1985-10-26T01:21:00Z')
      expect(schemaToExample({ type: 'string', format: 'password' })).toBe('xxxxxxx')
      expect(schemaToExample({ type: 'string', format: 'byte' })).toBe('QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT')
      expect(schemaToExample({ type: 'string', format: 'binary' })).toBe('[binary data]')
      expect(schemaToExample({ type: 'number' })).toBe(0)
      expect(schemaToExample({ type: 'integer' })).toBe(0)
      expect(schemaToExample({ type: 'boolean' })).toBe(false)
      expect(schemaToExample({ type: 'unknown' as any })).toBeUndefined()
    })
  })

  describe('object types', () => {
    it('returns object with examples from properties', () => {
      const schema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'John Doe',
          },
          age: {
            type: 'integer',
            example: 30,
          },
          isActive: {
            type: 'boolean',
            example: true,
          },
        },
      }

      const result = schemaToExample(schema)
      expect(result).toEqual({
        name: 'John Doe',
        age: 30,
        isActive: true,
      })
    })

    it('returns object with default values when no examples provided', () => {
      const schema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          age: {
            type: 'integer',
          },
          isActive: {
            type: 'boolean',
          },
        },
      }

      const result = schemaToExample(schema)
      expect(result).toEqual({
        name: '',
        age: 0,
        isActive: false,
      })
    })

    it('returns undefined for object with no properties', () => {
      const schema = {
        type: 'object',
      }

      const result = schemaToExample(schema)
      expect(result).toBeUndefined()
    })

    it('handles nested objects with examples', () => {
      const schema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: 'John Doe',
              },
              profile: {
                type: 'object',
                properties: {
                  bio: {
                    type: 'string',
                    example: 'Software Developer',
                  },
                },
              },
            },
          },
        },
      }

      const result = schemaToExample(schema)
      expect(result).toEqual({
        user: {
          name: 'John Doe',
          profile: {
            bio: 'Software Developer',
          },
        },
      })
    })

    it('handles mixed properties with and without examples', () => {
      const schema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'John Doe',
          },
          age: {
            type: 'integer',
          },
          isActive: {
            type: 'boolean',
          },
          nested: {
            type: 'object',
            properties: {},
          },
        },
      }

      const result = schemaToExample(schema)
      expect(result).toEqual({
        name: 'John Doe',
        age: 0,
        isActive: false,
      })
    })
  })

  describe('array types', () => {
    it('returns array with single example from items schema', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'string',
          example: 'item-example',
        },
      }

      const result = schemaToExample(schema)
      expect(result).toEqual(['item-example'])
    })

    it('returns array with default value when items has no example', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'string',
        },
      }

      const result = schemaToExample(schema)
      expect(result).toEqual([''])
    })

    it('returns undefined for array with no items schema', () => {
      const schema = {
        type: 'array',
      }

      const result = schemaToExample(schema)
      expect(result).toBeUndefined()
    })

    it('handles nested arrays', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'array',
          items: {
            type: 'string',
            example: 'nested-item',
          },
        },
      }

      const result = schemaToExample(schema)
      expect(result).toEqual([['nested-item']])
    })

    it('handles array of objects', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'John',
            },
            age: {
              type: 'integer',
              example: 30,
            },
          },
        },
      }

      const result = schemaToExample(schema)
      expect(result).toEqual([
        {
          name: 'John',
          age: 30,
        },
      ])
    })

    it('returns undefined for array with items that have no valid examples', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {},
        },
      }

      const result = schemaToExample(schema)
      expect(result).toBeUndefined()
    })
  })

  describe('complex nested structures', () => {
    it('handles complex nested object with arrays', () => {
      const schema = {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'John Doe',
                },
                tags: {
                  type: 'array',
                  items: {
                    type: 'string',
                    example: 'developer',
                  },
                },
              },
            },
          },
          metadata: {
            type: 'object',
            properties: {
              count: {
                type: 'integer',
                example: 5,
              },
              active: {
                type: 'boolean',
                example: true,
              },
            },
          },
        },
      }

      const result = schemaToExample(schema)
      expect(result).toEqual({
        users: [
          {
            name: 'John Doe',
            tags: ['developer'],
          },
        ],
        metadata: {
          count: 5,
          active: true,
        },
      })
    })

    it('handles schema with examples at root level', () => {
      const schema = {
        type: 'object',
        example: {
          name: 'John Doe',
          age: 30,
        },
        properties: {
          name: {
            type: 'string',
          },
          age: {
            type: 'integer',
          },
        },
      }

      const result = schemaToExample(schema)
      expect(result).toEqual({
        name: 'John Doe',
        age: 30,
      })
    })
  })

  describe('edge cases', () => {
    it('handles schema with empty examples array', () => {
      const schema = {
        type: 'string',
        examples: [],
      }

      const result = schemaToExample(schema)
      expect(result).toBe('')
    })

    it('handles schema with null example', () => {
      const schema = {
        type: 'string',
        example: null,
      }

      const result = schemaToExample(schema)
      expect(result).toBeNull()
    })

    it('handles schema with no type property', () => {
      const schema = {
        example: 'no-type-example',
      } as any

      const result = schemaToExample(schema)
      expect(result).toBe('no-type-example')
    })

    it('handles schema with invalid type', () => {
      const schema = {
        type: 'invalid-type' as any,
        example: 'invalid-type-example',
      }

      const result = schemaToExample(schema)
      expect(result).toBe('invalid-type-example')
    })
  })
})
