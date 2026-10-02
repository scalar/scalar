import type {
  ParameterObject,
  ParameterWithContentObject,
  ParameterWithSchemaObject,
  SchemaObject,
  SchemaReferenceType,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it, vi } from 'vitest'

import { resolve } from '@/resolve'

import { getExample } from './get-example'

/** A resolved component reference, the way the store hands one to a consumer. */
const schemaRef = (name: string, value: SchemaObject): SchemaReferenceType<SchemaObject> => ({
  '$ref': `#/components/schemas/${name}`,
  '$ref-value': value,
})

describe('content-based parameters', () => {
  it.each([0, false, ''])('keeps an explicit falsy example %s ahead of a schema default', (value) => {
    expect(
      getExample({ example: value, schema: { type: 'string', default: 'fallback' } }, undefined, undefined),
    ).toStrictEqual({ value })
    expect(
      getExample({ content: { 'application/json': { example: value } } }, undefined, 'application/json'),
    ).toStrictEqual({ value })
  })

  it('returns example value when content param has application/json with object value', () => {
    const param = {
      content: {
        'application/json': {
          example: { name: 'John', age: 30 },
        },
      },
    }

    const result = getExample(param, undefined, 'application/json')
    expect(result).toEqual({ value: { name: 'John', age: 30 } })
  })

  it('falls back to content.*.examples when param.examples is missing', () => {
    const param = {
      name: 'q',
      in: 'query',
      content: {
        'application/json': {
          examples: {
            sample: { value: { ok: true } },
          },
        },
      },
    }

    const result = getExample(param, 'sample', 'application/json')
    expect(result?.value).toEqual({ ok: true })
  })

  it('uses first media type and first example key when not provided', () => {
    const param = {
      name: 'q',
      in: 'query',
      content: {
        'text/plain': {
          examples: {
            e1: { value: 'hello' },
            e2: { value: 'world' },
          },
        },
      },
    }

    const result = getExample(param, undefined, undefined)
    expect(result?.value).toEqual('hello')
  })

  it('doesnt fallback when wrong example key is provided at param level', () => {
    const param = {
      name: 'q',
      in: 'query',
      examples: {
        a: { value: 'nope' },
      },
      content: {
        'application/json': {
          examples: { b: { value: 'yep' } },
        },
      },
    } satisfies ParameterWithContentObject

    const result = getExample(param, 'missing', 'application/json')
    expect(result?.value).toBeUndefined()
  })

  it('returns example value when content param has application/xml with string value', () => {
    const param = {
      content: {
        'application/xml': {
          example: '<user><name>John</name></user>',
        },
      },
    }

    const result = getExample(param, undefined, 'application/xml')
    expect(result).toEqual({ value: '<user><name>John</name></user>' })
  })

  it('returns content example field when exampleKey is provided and examples map is missing', () => {
    const param = {
      content: {
        'application/json': {
          example: { name: 'Fallback Content Example' },
        },
      },
    }

    const result = getExample(param, 'default', 'application/json')
    expect(result).toEqual({ value: { name: 'Fallback Content Example' } })
  })

  it('returns example from examples object when exampleKey is provided', () => {
    const param = {
      content: {
        'application/json': {
          examples: {
            user1: { value: { name: 'Alice' } },
            user2: { value: { name: 'Bob' } },
          },
        },
      },
    }

    const result = getExample(param, 'user2', 'application/json')
    expect(result).toEqual({ value: { name: 'Bob' } })
  })

  it('returns first example from examples object when no exampleKey is provided', () => {
    const param = {
      content: {
        'application/json': {
          examples: {
            user1: { value: { name: 'Alice' } },
            user2: { value: { name: 'Bob' } },
          },
        },
      },
    }

    const result = getExample(param, undefined, 'application/json')
    expect(result).toEqual({ value: { name: 'Alice' } })
  })

  it('uses first content type when contentType is not provided', () => {
    const param = {
      content: {
        'application/xml': {
          example: '<data>xml</data>',
        },
        'application/json': {
          example: { data: 'json' },
        },
      },
    }

    const result = getExample(param, undefined, undefined)
    expect(result).toEqual({ value: '<data>xml</data>' })
  })

  it('does not parse the string object if theres no content type', () => {
    const stringified = JSON.stringify({ data: 'json' })
    const param = {
      example: stringified,
    } as unknown as ParameterWithContentObject

    const result = getExample(param, undefined, undefined)
    expect(result).toEqual({ value: stringified })
  })

  it('does not parse the string array if theres no content type', () => {
    const stringified = JSON.stringify([1, 2, 3])
    const param = {
      example: stringified,
    } as unknown as ParameterWithContentObject

    const result = getExample(param, undefined, undefined)
    expect(result).toEqual({ value: stringified })
  })

  it('preserves edits saved at parameter level by older clients', () => {
    const param = {
      name: 'filter',
      in: 'query',
      examples: {
        default: { value: { status: 'from-param' }, 'x-disabled': false },
      },
      content: {
        'application/json': {
          example: { status: 'from-content' },
        },
      },
    } satisfies ParameterWithContentObject & Pick<ParameterWithSchemaObject, 'examples'>

    const result = getExample(param, 'default', 'application/json')
    expect(result).toStrictEqual({ value: { status: 'from-param' }, 'x-disabled': false })
  })

  it('returns undefined when no example is found in content', () => {
    const param = {
      content: {
        'application/json': {},
      },
    }

    const result = getExample(param, undefined, 'application/json')
    expect(result).toBeUndefined()
  })
})

describe('schema-based parameters', () => {
  it('collects declared property values without inventing missing examples', () => {
    const schema: SchemaObject = {
      type: 'object',
      required: ['missing'],
      properties: {
        active: { type: 'string', pattern: '^eq\\.(true|false)$', example: 'eq.true' },
        enabled: { type: 'boolean', examples: [false] },
        count: { type: 'integer', default: 0 },
        empty: { type: 'string', enum: [''] },
        nullable: { type: 'null', example: null },
        missing: { type: 'string' },
        nested: { type: 'object', properties: { name: { type: 'string', example: 'Ada' } } },
      },
    }
    expect(getExample({ schema }, undefined, undefined)).toStrictEqual({
      value: { active: 'eq.true', enabled: false, count: 0, empty: '', nullable: null, nested: { name: 'Ada' } },
    })
  })

  it.each([{}, null, false, 0, '', { active: 'edited' }])(
    'preserves explicit parameter and root schema values: %j',
    (value) => {
      const schema: SchemaObject = {
        type: 'object',
        properties: { active: { type: 'string', example: 'eq.true' } },
      }
      expect(getExample({ schema, example: value }, undefined, undefined)).toStrictEqual({ value })
      expect(getExample({ schema: { ...schema, example: value } }, undefined, undefined)).toStrictEqual({ value })
      expect(
        getExample({ schema, examples: { saved: { value, 'x-disabled': true } } }, 'saved', undefined),
      ).toStrictEqual({ value, 'x-disabled': true })
    },
  )

  it('leaves objects without declared property values unset', () => {
    expect(
      getExample(
        {
          schema: {
            type: 'object',
            properties: { nested: { type: 'object', properties: { id: { type: 'integer' } } } },
          },
        },
        undefined,
        undefined,
      ),
    ).toBeUndefined()
  })

  it('resolves shared property references and stops recursive references with siblings', () => {
    const shared: SchemaObject = { type: 'object', properties: { id: { type: 'integer', example: 42 } } }
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        first: { '$ref': '#/components/schemas/Shared', '$ref-value': shared },
        second: { '$ref': '#/components/schemas/Shared', '$ref-value': shared },
        local: {
          '$ref': '#/components/schemas/Name',
          '$ref-value': { type: 'string', example: 'target' },
          example: 'local',
        },
        unresolved: { $ref: '#/components/schemas/Missing' },
      },
    }
    schema.properties!.self = { '$ref': '#/components/schemas/Root', '$ref-value': schema, description: 'Recursive' }
    expect(getExample({ schema }, undefined, undefined)).toStrictEqual({
      value: { first: { id: 42 }, second: { id: 42 }, local: 'local' },
    })
  })

  it('visits a shared schema without declared values once, however many paths reach it', () => {
    const node: SchemaObject = { type: 'object', properties: { id: { type: 'string' } } }
    node.properties!.parent = schemaRef('Node', node)
    node.properties!.children = { type: 'array', items: schemaRef('Node', node) }

    // Ten levels, each pointing at the next three times: 3^10 paths reach the last level.
    const depth = 10
    let level: SchemaObject = { type: 'string' }
    for (let index = depth - 1; index >= 0; index--) {
      const next = schemaRef(`Level${index + 1}`, level)
      level = { type: 'object', properties: { a: next, b: next, c: next, node: schemaRef('Node', node) } }
    }

    const resolveSchema = vi.spyOn(resolve, 'schema')
    const result = getExample({ schema: level }, undefined, undefined)
    const visits = resolveSchema.mock.calls.length
    resolveSchema.mockRestore()

    expect(result).toBeUndefined()
    expect(visits).toBeLessThanOrEqual(depth * 6)
  })

  it('visits a shared schema once when it points back at a schema above it', () => {
    // Ten levels, each pointing at the next three times and back at the one above it.
    const depth = 10
    const properties: Record<string, SchemaReferenceType<SchemaObject>>[] = Array.from(
      { length: depth + 1 },
      () => ({}),
    )
    const levels = properties.map((level): SchemaObject => ({ type: 'object', properties: level }))
    properties.forEach((level, index) => {
      if (index < depth) {
        const next = schemaRef(`Level${index + 1}`, levels[index + 1]!)
        Object.assign(level, { a: next, b: next, c: next })
      }
      if (index > 0) {
        level.parent = schemaRef(`Level${index - 1}`, levels[index - 1]!)
      }
    })

    const resolveSchema = vi.spyOn(resolve, 'schema')
    const result = getExample({ schema: levels[0] }, undefined, undefined)
    const visits = resolveSchema.mock.calls.length
    resolveSchema.mockRestore()

    expect(result).toBeUndefined()
    expect(visits).toBeLessThanOrEqual(depth * 6)
  })

  it('collects a value reached back through a cycle from every path that reaches it', () => {
    const item: SchemaObject = { type: 'object', properties: { label: { type: 'string', example: 'first' } } }
    const owner: SchemaObject = { type: 'object', properties: {} }
    item.properties!.owner = schemaRef('Owner', owner)
    owner.properties!.item = schemaRef('Item', item)

    // `owner` finds nothing below `item.owner`, where the cycle stops at `item`, but reached directly
    // it walks into `item` and finds the label.
    expect(
      getExample(
        { schema: { type: 'object', properties: { item: schemaRef('Item', item), owner: schemaRef('Owner', owner) } } },
        undefined,
        undefined,
      ),
    ).toStrictEqual({ value: { item: { label: 'first' }, owner: { item: { label: 'first' } } } })
  })

  it('carries a cycle stop up through a schema skipped as already known to declare nothing', () => {
    const start: SchemaObject = { type: 'object', properties: {} }
    const back: SchemaObject = { type: 'object', properties: { start: schemaRef('Start', start) } }
    const via: SchemaObject = { type: 'object', properties: { back: schemaRef('Back', back) } }
    Object.assign(start.properties!, {
      back: schemaRef('Back', back),
      via: schemaRef('Via', via),
      value: { type: 'integer', example: 1 },
    })

    // Below `start`, `via` skips `back`, which only found nothing because the cycle stopped at `start`.
    expect(
      getExample(
        { schema: { type: 'object', properties: { start: schemaRef('Start', start), via: schemaRef('Via', via) } } },
        undefined,
        undefined,
      ),
    ).toStrictEqual({ value: { start: { value: 1 }, via: { back: { start: { value: 1 } } } } })
  })

  it('carries a cycle stop up through every schema between the stop and the schema it points at', () => {
    const start: SchemaObject = { type: 'object', properties: {} }
    const back: SchemaObject = { type: 'object', properties: { start: schemaRef('Start', start) } }
    const via: SchemaObject = { type: 'object', properties: { back: schemaRef('Back', back) } }
    Object.assign(start.properties!, { via: schemaRef('Via', via), value: { type: 'integer', example: 1 } })

    // Below `start`, `via` finds nothing only because the cycle two levels down stopped at `start`.
    expect(
      getExample(
        { schema: { type: 'object', properties: { start: schemaRef('Start', start), via: schemaRef('Via', via) } } },
        undefined,
        undefined,
      ),
    ).toStrictEqual({ value: { start: { value: 1 }, via: { back: { start: { value: 1 } } } } })
  })

  it('walks properties declared beside a reference to a schema already found to declare nothing', () => {
    const empty: SchemaObject = { type: 'object', properties: { id: { type: 'integer' } } }

    expect(
      getExample(
        {
          schema: {
            type: 'object',
            properties: {
              plain: schemaRef('Empty', empty),
              overridden: {
                '$ref': '#/components/schemas/Empty',
                '$ref-value': empty,
                properties: { id: { type: 'integer', example: 7 } },
              } as SchemaReferenceType<SchemaObject>,
            },
          },
        },
        undefined,
        undefined,
      ),
    ).toStrictEqual({ value: { overridden: { id: 7 } } })
  })

  it.each<{ schema: SchemaObject; value: unknown }>([
    { schema: { type: 'number', default: 0, enum: [1, 0, 2, 3], examples: [2], example: 3 }, value: 0 },
    { schema: { type: 'boolean', enum: [false, true], examples: [true], example: true }, value: false },
    { schema: { type: 'string', examples: [''], example: 'fallback' }, value: '' },
    { schema: { type: 'null', example: null }, value: null },
  ])('resolves schema references without changing fallback precedence ($value)', ({ schema, value }) => {
    const param: ParameterWithSchemaObject = {
      name: 'q',
      in: 'query',
      schema: { '$ref': '#/components/schemas/Query', '$ref-value': schema },
    }
    expect(getExample(param, 'default', undefined)).toEqual({ value })
    expect(getExample({ ...param, example: 'explicit' }, 'default', undefined)).toEqual({ value: 'explicit' })
    expect(
      getExample({ ...param, examples: { default: { value: 'edited', 'x-disabled': true } } }, 'default', undefined),
    ).toEqual({ value: 'edited', 'x-disabled': true })
  })

  it('preserves example annotations beside a schema reference', () => {
    const param: ParameterWithSchemaObject = {
      name: 'q',
      in: 'query',
      schema: {
        '$ref': '#/components/schemas/Query',
        '$ref-value': { type: 'string', examples: ['target'] },
        'examples': ['local'],
      },
    }
    expect(getExample(param, 'default', undefined)).toEqual({ value: 'local' })
  })

  it('leaves unresolved schema references without a fallback', () => {
    const param: ParameterWithSchemaObject = {
      name: 'q',
      in: 'query',
      schema: { $ref: '#/components/schemas/Missing' },
    }
    expect(getExample(param, 'default', undefined)).toBeUndefined()
    expect(getExample({ ...param, example: false }, 'default', undefined)).toEqual({ value: false })
  })

  it('returns example when schema type is object and value is an object', () => {
    const param = {
      schema: {
        type: 'object',
        example: { id: 1, name: 'Product' },
      },
    } as ParameterWithSchemaObject

    const result = getExample(param, undefined, undefined)
    expect(result).toEqual({ value: { id: 1, name: 'Product' } })
  })

  it('returns first value from schema.examples array', () => {
    const param = {
      schema: {
        type: 'object',
        examples: [
          { id: 2, title: 'Task' },
          { id: 3, title: 'Another Task' },
        ],
      },
    } as ParameterWithSchemaObject

    const result = getExample(param, undefined, undefined)
    expect(result).toEqual({ value: { id: 2, title: 'Task' } })
  })

  it('returns example when schema type is array', () => {
    const param = {
      schema: {
        type: 'array',
        example: [1, 2, 3, 4],
      },
    } as ParameterWithSchemaObject

    const result = getExample(param, undefined, undefined)
    expect(result).toEqual({ value: [1, 2, 3, 4] })
  })

  it('parses the boolean when schema type is boolean', () => {
    const param = {
      schema: {
        type: 'boolean',
        example: true,
      },
    } as ParameterWithSchemaObject
    const result = getExample(param, undefined, undefined)
    expect(result).toEqual({ value: true })
  })

  it('returns example from examples field at parameter level', () => {
    const param = {
      examples: {
        example1: { value: 'first' },
        example2: { value: 'second' },
      },
    } as unknown as ParameterWithSchemaObject

    const result = getExample(param, 'example2', undefined)
    expect(result).toEqual({ value: 'second' })
  })

  it('returns first example from examples object when no exampleKey is provided', () => {
    const param = {
      examples: {
        example1: { value: 'first' },
        example2: { value: 'second' },
      },
    } as unknown as ParameterWithSchemaObject

    const result = getExample(param, undefined, undefined)
    expect(result).toEqual({ value: 'first' })
  })

  it('returns default value from schema when no examples are provided', () => {
    const param = {
      schema: {
        type: 'string',
        default: 'default value',
      },
    } as ParameterWithSchemaObject

    const result = getExample(param, undefined, undefined)
    expect(result).toEqual({ value: 'default value' })
  })

  it('returns first enum value from schema when no examples are provided', () => {
    const param = {
      schema: {
        type: 'string',
        enum: ['active', 'inactive', 'pending'],
      },
    } as unknown as ParameterWithSchemaObject

    const result = getExample(param, undefined, undefined)
    expect(result).toEqual({ value: 'active' })
  })

  it('prioritizes default over enum over examples array over example field', () => {
    const param = {
      schema: {
        type: 'string',
        default: 'default value',
        enum: ['enum value'],
        examples: ['examples array value'],
        example: 'example field value',
      },
    } as ParameterWithSchemaObject

    const result = getExample(param, undefined, undefined)
    expect(result).toEqual({ value: 'default value' })
  })

  it('returns undefined when no example is found in schema', () => {
    const param = {
      schema: {
        type: 'string',
      },
    } as ParameterWithSchemaObject

    const result = getExample(param, undefined, undefined)
    expect(result).toBeUndefined()
  })

  it('returns schema default value when exampleKey does not exist', () => {
    const param = {
      name: 'limit',
      in: 'query',
      examples: {
        large: { value: 100 },
      },
      schema: {
        type: 'integer',
        default: 10,
      },
    } satisfies ParameterObject

    const result = getExample(param, 'nonexistent', undefined)
    expect(result?.value).toEqual(10)
  })

  it('returns schema default value for boolean type', () => {
    const param = {
      name: 'includeArchived',
      in: 'query',
      examples: {},
      schema: {
        type: 'boolean',
        default: false,
      },
    } satisfies ParameterObject

    const result = getExample(param, 'default', undefined)
    expect(result?.value).toEqual(false)
  })

  it('returns schema default value when default is 0', () => {
    const param = {
      name: 'offset',
      in: 'query',
      examples: {},
      schema: {
        type: 'integer',
        default: 0,
      },
    } satisfies ParameterObject

    const result = getExample(param, 'default', undefined)
    expect(result?.value).toEqual(0)
  })

  it('returns schema default value when default is empty string', () => {
    const param = {
      name: 'search',
      in: 'query',
      examples: {},
      schema: {
        type: 'string',
        default: '',
      },
    } satisfies ParameterObject

    const result = getExample(param, 'default', undefined)
    expect(result?.value).toEqual('')
  })

  it('returns undefined when schema has no default and no matching example', () => {
    const param = {
      name: 'page',
      in: 'query',
      examples: {
        first: { value: 1 },
      },
      schema: {
        type: 'integer',
      },
    } satisfies ParameterObject

    const result = getExample(param, 'nonexistent', undefined)
    expect(result).toBeUndefined()
  })

  it('returns first value from schema.enum when no other examples exist', () => {
    const param = {
      name: 'priority',
      in: 'query',
      schema: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
      },
    } satisfies ParameterObject

    const result = getExample(param, undefined, undefined)
    expect(result?.value).toEqual('low')
  })

  it('returns value from examples for array parameter', () => {
    const param = {
      name: 'domains',
      in: 'query',
      required: true,
      examples: {
        list: {
          summary: 'A list of domains',
          value: ['example.com', 'example.org'],
          'x-disabled': false,
        },
      },
      schema: {
        type: 'array',
        title: 'Domains',
        items: {
          type: 'string',
        },
      },
    } satisfies ParameterObject

    const result = getExample(param, 'list', undefined)
    expect(result?.value).toEqual(['example.com', 'example.org'])
  })
})

describe('other cases', () => {
  it('resolves $ref values when example is a reference', () => {
    const param = {
      name: 'data',
      in: 'query',
      examples: {
        sample: {
          '$ref': '#/components/examples/SampleData',
          '$ref-value': { value: 'resolved-example-data' },
        },
      },
    } satisfies ParameterObject

    const result = getExample(param, 'sample', undefined)
    expect(result?.value).toEqual('resolved-example-data')
  })

  it('returns value from param.examples by provided key', () => {
    const param = {
      name: 'q',
      in: 'query',
      examples: {
        a: { value: 123 },
        b: { value: 456 },
      },
    } satisfies ParameterObject

    const result = getExample(param, 'b', undefined)
    expect(result?.value).toEqual(456)
  })

  it('returns deprecated param.example when present and no others match', () => {
    const param = {
      name: 'q',
      in: 'query',
      example: 'fallback',
    } satisfies ParameterObject

    const result = getExample(param, undefined, undefined)
    expect(result?.value).toEqual('fallback')
  })

  it('returns deprecated param.example when exampleKey is provided and examples map is missing', () => {
    const param = {
      name: 'q',
      in: 'query',
      example: 'fallback',
    } satisfies ParameterObject

    const result = getExample(param, 'default', undefined)
    expect(result?.value).toEqual('fallback')
  })

  it('returns undefined when no examples or example fields exist', () => {
    const param = {
      name: 'q',
      in: 'query',
    } satisfies ParameterObject

    const result = getExample(param, undefined, undefined)
    expect(result).toBeUndefined()
  })

  it('handles empty object gracefully', () => {
    const param = {} as ParameterObject
    const result = getExample(param, undefined, undefined)
    expect(result).toBeUndefined()
  })

  it('handles null values in example', () => {
    const param = {
      schema: {
        type: 'string',
        example: null,
      },
    } as ParameterWithSchemaObject

    const result = getExample(param, undefined, undefined)
    expect(result).toEqual({ value: null })
  })

  it('handles falsy values in example (false, 0, empty string, null)', () => {
    const falsyTests = [
      { value: false, type: 'boolean' },
      { value: 0, type: 'number' },
      { value: '', type: 'string' },
      { value: null, type: 'string' },
    ]

    falsyTests.forEach(({ value, type }) => {
      const param = {
        schema: {
          type,
          example: value,
        },
      } as ParameterWithSchemaObject

      const result = getExample(param, undefined, undefined)
      expect(result).toEqual({ value })
    })
  })
})
