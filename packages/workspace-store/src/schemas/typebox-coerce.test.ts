import { coerceValue } from '@/schemas/typebox-coerce'
import { Type } from '@sinclair/typebox'
import { describe, expect, it } from 'vitest'

describe('should correctly cast/default values to make the input schema compliant', () => {
  it.each([
    [Type.Number(), '10', 10],
    [Type.Number(), null, 0],
    [Type.Number(), {}, 0],
    [Type.String(), 10, '10'],
    [Type.String(), null, ''],
    [Type.String(), {}, ''],
    [Type.String(), 0, '0'],
    [Type.String(), 1, '1'],
    [Type.Boolean(), 1, true],
    [Type.Boolean(), 'true', true],
    [Type.Boolean(), 0, false],
    [Type.Boolean(), 'false', false],
    [Type.Object({}), null, {}],
    [Type.Object({}), 1, {}],
    [Type.Object({}), 0, {}],
    [Type.Object({}), 'true', {}],
    [Type.Object({}), 'false', {}],
    [
      Type.Object({
        name: Type.String(),
      }),
      'false',
      { name: '' },
    ],
    [
      Type.Object({
        name: Type.String(),
      }),
      '',
      { name: '' },
    ],
    [
      Type.Object({
        name: Type.String(),
      }),
      10,
      { name: '' },
    ],
    [
      Type.Object({
        name: Type.String(),
      }),
      true,
      { name: '' },
    ],
    [Type.Array(Type.String()), 10, ['10']],
    [Type.Array(Type.Number()), '', [0]],
  ])('should cast to appropriate type', (schema, value, result) => {
    expect(coerceValue(schema, value)).toEqual(result)
  })

  it('should correctly use the default value when no value is provided', () => {
    const schema = Type.Object({
      name: Type.String({ default: 'marc' }),
    })

    expect(coerceValue(schema, {})).toEqual({
      name: 'marc',
    })
  })

  it('should use the type default value when no value is provided and type is required', () => {
    const schema = Type.Object({
      name: Type.String(),
    })

    expect(coerceValue(schema, {})).toEqual({
      name: '',
    })
  })

  it('should work well with union types', () => {
    const schema = Type.Union([
      Type.Object({
        name: Type.String({ default: 'john' }),
        age: Type.Number(),
      }),
      Type.Object({
        surname: Type.String({ default: 'doe' }),
      }),
    ])

    expect(coerceValue(schema, {})).toEqual({ name: 'john', age: 0 })
  })

  it('should strip the optional values if not provided', () => {
    const schema = Type.Object({
      name: Type.Optional(Type.String({ default: 'john' })),
      age: Type.Number(),
    })

    expect(coerceValue(schema, {})).toEqual({ age: 0 })
  })
})
