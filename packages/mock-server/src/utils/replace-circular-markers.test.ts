import { getResolvedRefDeep } from '@scalar/workspace-store/helpers/get-resolved-ref-deep'
import Ajv2020 from 'ajv/dist/2020.js'
import { describe, expect, it } from 'vitest'

import { replaceCircularMarkers } from './replace-circular-markers'

describe('replaceCircularMarkers', () => {
  it('replaces a marker in a property with an always-valid schema', () => {
    expect(
      replaceCircularMarkers({
        type: 'object',
        properties: { name: { type: 'string' }, child: '[circular]' },
      }),
    ).toStrictEqual({
      type: 'object',
      properties: { name: { type: 'string' }, child: {} },
    })
  })

  it('replaces markers in every keyword that holds a schema or an array of schemas', () => {
    expect(
      replaceCircularMarkers({
        items: '[circular]',
        additionalItems: '[circular]',
        additionalProperties: '[circular]',
        contentSchema: '[circular]',
        propertyNames: '[circular]',
        allOf: [{ type: 'object' }, '[circular]'],
        anyOf: ['[circular]'],
        prefixItems: ['[circular]'],
      }),
    ).toStrictEqual({
      items: {},
      additionalItems: {},
      additionalProperties: {},
      contentSchema: {},
      propertyNames: {},
      allOf: [{ type: 'object' }, {}],
      anyOf: [{}],
      prefixItems: [{}],
    })
  })

  it('replaces markers nested deep inside a schema', () => {
    expect(
      replaceCircularMarkers({
        type: 'object',
        properties: {
          children: { type: 'array', items: { type: 'object', properties: { parent: '[circular]' } } },
        },
      }),
    ).toStrictEqual({
      type: 'object',
      properties: {
        children: { type: 'array', items: { type: 'object', properties: { parent: {} } } },
      },
    })
  })

  it('rewrites schemas under $defs, definitions, patternProperties and dependentSchemas', () => {
    expect(
      replaceCircularMarkers({
        $defs: { node: '[circular]' },
        definitions: { node: '[circular]' },
        patternProperties: { '^x-': '[circular]' },
        dependentSchemas: { credit_card: '[circular]' },
      }),
    ).toStrictEqual({
      $defs: { node: {} },
      definitions: { node: {} },
      patternProperties: { '^x-': {} },
      dependentSchemas: { credit_card: {} },
    })
  })

  it('replaces a marker in an unevaluated keyword', () => {
    expect(
      replaceCircularMarkers({ type: 'object', unevaluatedProperties: '[circular]', unevaluatedItems: '[circular]' }),
    ).toStrictEqual({ type: 'object', unevaluatedProperties: {}, unevaluatedItems: {} })
  })

  it('drops an inverting keyword whose cycle was cut further down', () => {
    // Relaxing one branch of a `oneOf` would let a value match two branches and be rejected, so the
    // whole composition goes — the cut can be arbitrarily deep inside the branch.
    expect(
      replaceCircularMarkers({
        type: 'object',
        oneOf: [{ properties: { value: { properties: { next: '[circular]' } } } }, { type: 'null' }],
      }),
    ).toStrictEqual({ type: 'object' })
  })

  it('drops minContains and maxContains along with a dropped contains', () => {
    expect(
      replaceCircularMarkers({ type: 'array', contains: { items: '[circular]' }, minContains: 1, maxContains: 2 }),
    ).toStrictEqual({ type: 'array' })
  })

  it('drops unevaluated keywords when a dropped keyword stops accounting for values', () => {
    // A dropped `contains` no longer marks the items it matched as evaluated, so keeping
    // `unevaluatedItems: false` would reject the arrays it used to accept.
    expect(replaceCircularMarkers({ type: 'array', contains: '[circular]', unevaluatedItems: false })).toStrictEqual({
      type: 'array',
    })
  })

  it('drops unevaluated keywords when an in-place applicator was relaxed', () => {
    // An always-valid branch evaluates nothing, so `unevaluatedProperties: false` would reject every
    // property the original branch used to account for.
    expect(replaceCircularMarkers({ allOf: ['[circular]'], unevaluatedProperties: false })).toStrictEqual({
      allOf: [{}],
    })
  })

  it('keeps unevaluated keywords when nothing around them was relaxed', () => {
    const schema = { allOf: [{ properties: { name: { type: 'string' } } }], unevaluatedProperties: false }

    expect(replaceCircularMarkers(schema)).toStrictEqual(schema)
  })

  it('drops keywords an always-valid schema would tighten instead of relax', () => {
    expect(
      replaceCircularMarkers({
        type: 'object',
        not: '[circular]',
        contains: '[circular]',
        oneOf: ['[circular]', { type: 'null' }],
      }),
    ).toStrictEqual({ type: 'object' })
  })

  it('drops then and else along with a cut if condition', () => {
    expect(
      replaceCircularMarkers({
        type: 'object',
        if: '[circular]',
        then: { required: ['a'] },
        else: { required: ['b'] },
      }),
    ).toStrictEqual({ type: 'object' })
  })

  it('keeps an inverting keyword that no rewrite touched', () => {
    const schema = {
      oneOf: [{ type: 'object', properties: { child: { type: 'string' } } }, { type: 'null' }],
      not: { type: 'array' },
    }

    expect(replaceCircularMarkers(schema)).toStrictEqual(schema)
  })

  it('keeps a nullable recursive reference accepting null once compiled', () => {
    const ajv = new Ajv2020({ strict: false, allErrors: true })

    // `oneOf: [{}, { type: 'null' }]` would match both branches and reject `null` outright, so the
    // whole `oneOf` has to go instead.
    const validate = ajv.compile(
      replaceCircularMarkers({
        type: 'object',
        properties: { parent: { oneOf: ['[circular]', { type: 'null' }] } },
      }) as object,
    )

    expect(validate({ parent: null })).toBe(true)
    expect(validate({ parent: { anything: true } })).toBe(true)
  })

  it('rewrites schemas under the draft-07 dependencies keyword', () => {
    // Ajv 2020 still compiles `dependencies`, so a marker below it would break the whole schema.
    expect(
      replaceCircularMarkers({
        type: 'object',
        dependencies: { name: '[circular]', nickname: ['name'], parent: { properties: { of: '[circular]' } } },
      }),
    ).toStrictEqual({
      type: 'object',
      dependencies: { name: {}, nickname: ['name'], parent: { properties: { of: {} } } },
    })
  })

  it('turns a cut at a schema map itself into an empty map', () => {
    // The empty map accounts for no property any more, so the keywords that police what it left over
    // go with it.
    expect(
      replaceCircularMarkers({
        type: 'object',
        properties: '[circular]',
        additionalProperties: false,
        unevaluatedProperties: false,
      }),
    ).toStrictEqual({
      type: 'object',
      properties: {},
    })
  })

  it('drops items along with a cut prefixItems', () => {
    // `items` only applies past the prefix, so keeping it would reject the entries the prefix covered.
    expect(replaceCircularMarkers({ type: 'array', prefixItems: '[circular]', items: false })).toStrictEqual({
      type: 'array',
    })
  })

  it('rewrites the same object differently as a schema and as a schema map', () => {
    // `{ not: … }` is a keyword in a schema, and a schema named `not` under `properties`.
    const shared = { not: { properties: { x: '[circular]' } } }

    expect(replaceCircularMarkers({ properties: shared, allOf: [shared] })).toStrictEqual({
      properties: { not: { properties: { x: {} } } },
      allOf: [{}],
    })
  })

  it('terminates on a truly cyclic schema object', () => {
    const cyclic: Record<string, unknown> = { type: 'object' }
    cyclic.properties = { self: cyclic }

    const result = replaceCircularMarkers(cyclic) as { properties: { self: unknown } }

    expect(result.properties.self).toBe(result)
  })

  it('drops an array-valued keyword whose cut is at the array itself', () => {
    // `allOf: {}` is not something Ajv can compile, so the keyword goes instead.
    expect(replaceCircularMarkers({ type: 'object', allOf: '[circular]', anyOf: '[circular]' })).toStrictEqual({
      type: 'object',
    })
  })

  it('leaves a marker-shaped value in a data keyword untouched', () => {
    const schema = {
      type: 'object',
      properties: {
        // A property genuinely named after one of the schema keywords must still be read as a name.
        items: { type: 'string', enum: ['[circular]'], default: '[circular]', example: '[circular]' },
      },
      required: ['items'],
      const: '[circular]',
    }

    expect(replaceCircularMarkers(schema)).toStrictEqual(schema)
  })

  it('returns primitives and empty schemas unchanged', () => {
    expect(replaceCircularMarkers(true)).toBe(true)
    expect(replaceCircularMarkers(null)).toBe(null)
    expect(replaceCircularMarkers({})).toStrictEqual({})
  })

  it('walks a shared subschema without duplicating work or looping forever', () => {
    const shared: Record<string, unknown> = { type: 'object', properties: { self: '[circular]' } }
    const result = replaceCircularMarkers({ allOf: [shared, shared] }) as { allOf: unknown[] }

    expect(result.allOf[0]).toStrictEqual({ type: 'object', properties: { self: {} } })
    // The shared schema is rewritten once and reused, mirroring how the resolver shares it.
    expect(result.allOf[0]).toBe(result.allOf[1])
  })

  it('makes a resolved recursive schema compile with Ajv', () => {
    const node = {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        child: {} as Record<string, unknown>,
      },
    }
    // Mirror how the workspace store hands back a recursive schema: the `$ref` carries its resolved
    // value, and the deep resolver cuts the cycle with a `'[circular]'` marker.
    node.properties.child = { $ref: '#/components/schemas/Node', '$ref-value': node }

    const resolved = getResolvedRefDeep(node)
    expect((resolved as { properties: { child: unknown } }).properties.child).toBe('[circular]')

    const ajv = new Ajv2020({ strict: false, allErrors: true })
    expect(() => ajv.compile(resolved as object)).toThrow()

    const validate = ajv.compile(replaceCircularMarkers(resolved) as object)
    expect(validate({ name: 'root', child: { name: 'leaf' } })).toBe(true)
    expect(validate({ child: { name: 'leaf' } })).toBe(false)
  })
})
