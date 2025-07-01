import { createMagicProxy } from '@/helpers/proxy'
import { describe, expect, it } from 'vitest'

describe('createMagicProxy', () => {
  it('should correctly proxy internal refs', () => {
    const input = {
      a: 'hello',
      b: {
        '$ref': '#/a',
      },
    }

    const result = createMagicProxy(input)

    expect(result.b).toBe('hello')
  })

  it('should correctly proxy deep nested refs', () => {
    const input = {
      a: {
        b: {
          c: {
            d: {
              prop: 'hello',
            },
            e: {
              '$ref': '#/a/b/c/d',
            },
          },
        },
      },
    }

    const result = createMagicProxy(input) as any
    expect(result.a.b.c.e.prop).toBe('hello')
  })

  it('should correctly proxy multi refs', () => {
    const input = {
      a: {
        b: {
          c: {
            prop: 'hello',
          },
        },
      },
      e: {
        f: {
          $ref: '#/a/b/c/prop',
        },
      },
      d: {
        $ref: '#/e/f',
      },
    }

    const result = createMagicProxy(input)

    expect(result.d).toBe('hello')
  })

  it('should preserve information about the ref when the ref is resolved', () => {
    const input = {
      a: {
        b: {
          c: {
            d: {
              prop: 'hello',
            },
            e: {
              '$ref': '#/a/b/c/d',
            },
          },
        },
      },
    }

    const result = createMagicProxy(input)
    expect(result.a.b.c.e).toEqual({
      prop: 'hello',
      'x-original-ref': '#/a/b/c/d',
    })
  })

  it('should preserve the first ref on nested refs', () => {
    const input = {
      a: {
        b: {
          c: {
            d: {
              '$ref': '#/a/b/c/f',
            },
            e: {
              '$ref': '#/a/b/c/d',
            },
            f: {
              someProp: 'test',
            },
          },
        },
      },
    }

    const result = createMagicProxy(input)
    expect(result.a.b.c.e).toEqual({
      someProp: 'test',
      'x-original-ref': '#/a/b/c/d',
    })
  })

  it('should preserve sibling keywords alongside $ref (OpenAPI 3.1/JSON Schema 2020-12)', () => {
    const input = {
      components: {
        schemas: {
          Foo: {
            type: 'string',
            pattern: 'bar$',
          },
        },
      },
      paths: {
        '/foo': {
          get: {
            responses: {
              '200': {
                description: 'Ok',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Foo',
                      pattern: '^foo',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const result = createMagicProxy(input)

    const resolvedSchema = result.paths['/foo'].get.responses['200'].content['application/json'].schema as any

    // Should preserve the original ref information
    expect(resolvedSchema['x-original-ref']).toBe('#/components/schemas/Foo')

    // Should contain properties from the referenced schema
    expect(resolvedSchema.type).toBe('string')

    // Should preserve BOTH patterns - the one from the referenced schema AND the sibling keyword
    // This is the key issue: both constraints should be preserved and applied
    expect(resolvedSchema).toEqual({
      type: 'string',
      pattern: '^foo.*bar$', // merged pattern requiring both constraints
      'x-original-ref': '#/components/schemas/Foo',
    })
  })

  it('merges sibling keywords with $ref', () => {
    const input = {
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
            required: ['name', 'email'],
            description: 'User registration data',
            additionalProperties: false,
          },
        },
      },
      paths: {
        '/users': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/User',
                  },
                },
              },
            },
          },
        },
      },
    }

    const result = createMagicProxy(input)
    const resolvedSchema = result.paths['/users'].post.requestBody.content['application/json'].schema as any

    // Should preserve the original ref information
    expect(resolvedSchema['x-original-ref']).toBe('#/components/schemas/User')

    // Should contain properties from the referenced schema
    expect(resolvedSchema.type).toBe('object')
    expect(resolvedSchema.properties).toEqual({
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
    })

    // Should merge sibling keywords, with sibling 'required' overriding the referenced one
    expect(resolvedSchema.required).toEqual(['name', 'email'])
    expect(resolvedSchema.description).toBe('User registration data')
    expect(resolvedSchema.additionalProperties).toBe(false)
  })

  it('merges enum and default sibling keywords with $ref', () => {
    const input = {
      components: {
        schemas: {
          Status: {
            type: 'string',
            enum: ['active', 'inactive'],
            default: 'active',
          },
        },
      },
      paths: {
        '/status': {
          get: {
            responses: {
              '200': {
                description: 'Status',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Status',
                      default: 'inactive',
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const result = createMagicProxy(input)
    const resolvedSchema = result.paths['/status'].get.responses['200'].content['application/json'].schema as any

    expect(resolvedSchema['x-original-ref']).toBe('#/components/schemas/Status')
    expect(resolvedSchema.type).toBe('string')
    expect(resolvedSchema.enum).toEqual(['active', 'inactive'])
    // Sibling default should override referenced default
    expect(resolvedSchema.default).toBe('inactive')
  })

  it('merges multiple sibling constraints with $ref', () => {
    const input = {
      components: {
        schemas: {
          Number: {
            type: 'number',
            minimum: 0,
            maximum: 10,
          },
        },
      },
      paths: {
        '/number': {
          get: {
            responses: {
              '200': {
                description: 'Number',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Number',
                      minimum: 5,
                      maximum: 8,
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const result = createMagicProxy(input)
    const resolvedSchema = result.paths['/number'].get.responses['200'].content['application/json'].schema as any

    expect(resolvedSchema['x-original-ref']).toBe('#/components/schemas/Number')
    expect(resolvedSchema.type).toBe('number')
    // Sibling minimum/maximum should override referenced ones
    expect(resolvedSchema.minimum).toBe(5)
    expect(resolvedSchema.maximum).toBe(8)
  })

  it('handles $ref with sibling allOf/oneOf/anyOf', () => {
    const input = {
      components: {
        schemas: {
          Base: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
        },
      },
      paths: {
        '/allof': {
          get: {
            responses: {
              '200': {
                description: 'AllOf',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Base',
                      allOf: [{ properties: { extra: { type: 'number' } } }],
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const result = createMagicProxy(input)
    const resolvedSchema = result.paths['/allof'].get.responses['200'].content['application/json'].schema as any

    expect(resolvedSchema['x-original-ref']).toBe('#/components/schemas/Base')
    expect(resolvedSchema.type).toBe('object')
    expect(resolvedSchema.properties).toEqual({ id: { type: 'string' } })
    expect(resolvedSchema.allOf).toEqual([{ properties: { extra: { type: 'number' } } }])
  })
})
