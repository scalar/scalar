import { Storage } from '@google-cloud/storage'
import { Type } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { compose } from '@/schemas/compose'
import { coerceValue } from '@/schemas/typebox-coerce'
import { ComponentsObjectSchema, OpenAPIDocumentSchema } from '@/schemas/v3.1/strict/openapi-document'

const storage = new Storage()
const bucket = storage.bucket('scalar-test-fixtures')

async function listFiles(folder: string, limit: number) {
  const [files] = await bucket.getFiles({ prefix: folder, maxResults: limit })
  return files
}

describe('should correctly cast/default values to make the input schema compliant', () => {
  it.each([
    [Type.Number(), '10', 0],
    [Type.Number(), null, 0],
    [Type.Number(), {}, 0],
    [Type.String(), 10, ''],
    [Type.String(), null, ''],
    [Type.String(), {}, ''],
    [Type.String(), 0, ''],
    [Type.String(), 1, ''],
    [Type.Boolean(), 1, false],
    [Type.Boolean(), 'true', false],
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
    [Type.Array(Type.String()), 10, []],
    [Type.Array(Type.Number()), '', []],
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

  it('does not default everything when we have some missing fields', () => {
    const schema = compose(
      Type.Record(Type.TemplateLiteral('x-${string}'), Type.Unknown()),
      Type.Object({
        name: Type.String(),
        age: Type.Optional(Type.Number()),
        location: Type.Object({
          lat: Type.Number(),
          long: Type.Number(),
        }),
        greeting: Type.String(),
      }),
    )

    expect(coerceValue(schema, { location: {}, greeting: 'Hello' })).toEqual({
      name: '',
      location: {
        lat: 0,
        long: 0,
      },
      greeting: 'Hello',
    })
  })

  it('should pass strict validation after coerce values', { timeout: 100_000 }, async () => {
    // Get first 300 files to run the tests
    const files = await Promise.all((await listFiles('oas/files', 300)).map((it) => it.download()))

    const result = files.every((file) => {
      const [buffer] = file

      const content = buffer.toString()

      // validate after we coerce the document
      return Value.Check(OpenAPIDocumentSchema, coerceValue(OpenAPIDocumentSchema, content))
    })

    expect(result).toBe(true)
  })

  it('should correctly handle union types', () => {
    const input = {
      securitySchemes: {
        someName: {
          'type': 'oauth2',
          'description': 'OAuth 2.0 authentication',
          'flows': {
            'authorizationCode': {
              'authorizationUrl': 'https://galaxy.scalar.com/oauth/authorize',
              'scopes': {
                'read:account': 'read your account information',
                'write:planets': 'modify planets in your account',
                'read:planets': 'read your planets',
              },
            },
            'clientCredentials': {
              'tokenUrl': 'https://galaxy.scalar.com/oauth/token',
              'scopes': {
                'read:account': 'read your account information',
                'write:planets': 'modify planets in your account',
                'read:planets': 'read your planets',
              },
            },
            'implicit': {
              'authorizationUrl': 'https://galaxy.scalar.com/oauth/authorize',
              'scopes': {
                'read:account': 'read your account information',
                'write:planets': 'modify planets in your account',
                'read:planets': 'read your planets',
              },
            },
            'password': {
              'tokenUrl': 'https://galaxy.scalar.com/oauth/token',
              'scopes': {
                'read:account': 'read your account information',
                'write:planets': 'modify planets in your account',
                'read:planets': 'read your planets',
              },
            },
          },
        },
      },
    }

    const result = coerceValue(ComponentsObjectSchema, input)

    expect(result).toEqual({
      securitySchemes: {
        someName: {
          'type': 'oauth2',
          'description': 'OAuth 2.0 authentication',
          'flows': {
            'authorizationCode': {
              'authorizationUrl': 'https://galaxy.scalar.com/oauth/authorize',
              'scopes': {
                'read:account': 'read your account information',
                'read:planets': 'read your planets',
                'write:planets': 'modify planets in your account',
              },
              'tokenUrl': '',
            },
            'clientCredentials': {
              'scopes': {
                'read:account': 'read your account information',
                'read:planets': 'read your planets',
                'write:planets': 'modify planets in your account',
              },
              'tokenUrl': 'https://galaxy.scalar.com/oauth/token',
            },
            'implicit': {
              'authorizationUrl': 'https://galaxy.scalar.com/oauth/authorize',
              'scopes': {
                'read:account': 'read your account information',
                'read:planets': 'read your planets',
                'write:planets': 'modify planets in your account',
              },
            },
            'password': {
              'scopes': {
                'read:account': 'read your account information',
                'read:planets': 'read your planets',
                'write:planets': 'modify planets in your account',
              },
              'tokenUrl': 'https://galaxy.scalar.com/oauth/token',
            },
          },
        },
      },
    })
  })

  it('should preserve extra properties', () => {
    const result = coerceValue(
      Type.Object({
        hi: Type.String(),
      }),
      {
        hi: 'hello',
        extra: 'some-extra-property',
      },
    )

    expect(result).toEqual({
      hi: 'hello',
      extra: 'some-extra-property',
    })
  })
})
