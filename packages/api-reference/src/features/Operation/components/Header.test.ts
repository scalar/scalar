import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { HeaderObjectSchema, SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { SpecificationExtension } from '@/features/specification-extension'

import Header from './Header.vue'

const baseProps = {
  name: 'Set-Cookie',
  eventBus: null,
  orderSchemaPropertiesBy: undefined,
  orderRequiredPropertiesFirst: undefined,
  expandAllSchemaProperties: true,
  schemaKeyboardNav: undefined,
  hideModels: undefined,
}

describe('Header', () => {
  it.each(['oneOf', 'anyOf'] as const)('prefers explicit header examples through %s branches', (keyword) => {
    const wrapper = mount(Header, {
      props: {
        ...baseProps,
        header: {
          schema: coerceValue(SchemaObjectSchema, {
            [keyword]: [
              { type: 'string', example: 'schema single', examples: ['schema multiple'] },
              { type: 'integer', example: 42 },
            ],
          }),
          example: 'header sample',
        },
      },
    })

    expect(
      wrapper
        .findAll('button')
        .map((button) => button.attributes('aria-label'))
        .filter((name) => name?.startsWith('Copy example value:')),
    ).toStrictEqual(['Copy example value: header sample'])
    wrapper.unmount()
  })

  it('shows a two-branch allOf header example once while preserving nested property examples', () => {
    const wrapper = mount(Header, {
      props: {
        ...baseProps,
        header: {
          schema: coerceValue(SchemaObjectSchema, {
            allOf: [
              {
                $ref: '#/components/schemas/Cookies',
                '$ref-value': {
                  type: 'object',
                  examples: [{ session: 'schema sample' }],
                  properties: { session: { type: 'string', example: 'property sample' } },
                },
              },
              { type: 'object', properties: { theme: { type: 'string' } }, example: { theme: 'schema sample' } },
            ],
          }),
          example: { session: 'header sample' },
        },
      },
    })

    expect(
      wrapper
        .findAll('button')
        .map((button) => button.attributes('aria-label'))
        .filter((name) => name?.startsWith('Copy example value:')),
    ).toStrictEqual(['Copy example value: {"session":"header sample"}', 'Copy example value: property sample'])
    wrapper.unmount()
  })

  it.each([{}, { pending: { $ref: '#/components/examples/Pending' } }])(
    'falls back to media type examples when header examples have no usable values: %j',
    (examples) => {
      const wrapper = mount(Header, {
        props: {
          ...baseProps,
          header: {
            examples,
            content: {
              'text/plain': {
                schema: coerceValue(SchemaObjectSchema, { type: 'string', example: 'schema' }),
                example: 'media sample',
              },
            },
          },
        },
      })

      expect(
        wrapper
          .findAll('button')
          .map((button) => button.attributes('aria-label'))
          .filter((name) => name?.startsWith('Copy example value:')),
      ).toStrictEqual(['Copy example value: media sample'])
      wrapper.unmount()
    },
  )

  it('does not show an array item example alongside an explicit header example', () => {
    const wrapper = mount(Header, {
      props: {
        ...baseProps,
        name: 'X-Names',
        header: {
          schema: coerceValue(SchemaObjectSchema, {
            type: 'array',
            items: { type: 'string', example: 'schema item' },
          }),
          examples: { names: { value: 'alice,bob' } },
        },
      },
    })

    expect(
      wrapper
        .findAll('button')
        .map((button) => button.attributes('aria-label'))
        .filter((name) => name?.startsWith('Copy example value:')),
    ).toStrictEqual(['Copy example value: names: alice,bob'])
    wrapper.unmount()
  })

  it.each(['schema', 'content'] as const)('renders explicit %s examples instead of schema examples', (kind) => {
    const schema = coerceValue(SchemaObjectSchema, {
      type: 'string',
      example: 'schema single',
      examples: ['schema multiple'],
    })
    const wrapper = mount(Header, {
      props: {
        ...baseProps,
        name: 'X-Request-Id',
        header:
          kind === 'schema'
            ? { schema, example: 'req_123' }
            : { content: { 'text/plain': { schema, example: 'req_123' } } },
      },
    })

    expect(
      wrapper
        .findAll('button')
        .map((button) => button.attributes('aria-label'))
        .filter((name) => name?.startsWith('Copy example value:')),
    ).toStrictEqual(['Copy example value: req_123'])
    wrapper.unmount()
  })

  it.each(['schema', 'content'] as const)(
    'renders named %s examples, including references and falsy values',
    (kind) => {
      const examples = {
        legacy: { value: 'legacy' },
        reference: { $ref: '#/components/examples/RequestId', '$ref-value': { value: 'req_123' } },
        data: { dataValue: { value: 'cookie', externalValue: 'local' } },
        zero: { dataValue: 0 },
        no: { value: false },
        empty: { value: '' },
        nullable: { dataValue: null },
        unresolved: { $ref: '#/components/examples/Pending' },
        external: { externalValue: 'https://example.com/pending.txt' },
      }
      const schema = coerceValue(SchemaObjectSchema, { type: 'string' })
      const wrapper = mount(Header, {
        props: {
          ...baseProps,
          header: kind === 'schema' ? { schema, examples } : { content: { 'text/plain': { schema, examples } } },
        },
      })

      expect(
        wrapper
          .findAll('button')
          .map((button) => button.attributes('aria-label'))
          .filter((name) => name?.startsWith('Copy example value:')),
      ).toStrictEqual([
        'Copy example value: legacy: legacy',
        'Copy example value: reference: req_123',
        'Copy example value: data: {"value":"cookie","externalValue":"local"}',
        'Copy example value: zero: 0',
        'Copy example value: no: false',
        'Copy example value: empty: ',
        'Copy example value: nullable: null',
        'Copy example value: external: https://example.com/pending.txt',
      ])
      wrapper.unmount()
    },
  )

  it('shows cookie descriptions and prefers serialized text without combining cookie lines', () => {
    const serializedValue = 'foo=abc; Expires=Wed, 09 Jun 2027 10:18:14 GMT\nbar=dark; Path=/'
    const wrapper = mount(Header, {
      props: {
        ...baseProps,
        header: {
          description: 'Cookies for this session',
          schema: {
            $ref: '#/components/schemas/Cookies',
            '$ref-value': coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                foo: { type: 'string', description: 'Session identifier' },
                bar: { type: 'string', description: 'Theme preference' },
              },
            }),
          },
          examples: { cookies: { dataValue: { foo: 'abc', bar: 'dark' }, serializedValue } },
        },
      },
    })

    expect(wrapper.text()).toContain('Cookies for this session')
    expect(wrapper.text()).toContain('Session identifier')
    expect(wrapper.text()).toContain('Theme preference')
    expect(
      wrapper
        .findAll('button')
        .find((button) => button.attributes('aria-label')?.startsWith('Copy example value:'))
        ?.attributes('aria-label'),
    ).toBe(`Copy example value: cookies: ${serializedValue}`)
    wrapper.unmount()
  })

  it('prefers OpenAPI 3.2 header examples over content and schema examples', () => {
    const wrapper = mount(Header, {
      props: {
        ...baseProps,
        header: coerceValue(HeaderObjectSchema, {
          content: {
            'text/plain': {
              schema: { type: 'string', example: 'schema' },
              examples: { cookies: { value: 'media type' } },
            },
          },
          examples: { cookies: { serializedValue: 'foo=abc\nbar=dark' } },
        }),
      },
    })

    expect(
      wrapper
        .findAll('button')
        .map((button) => button.attributes('aria-label'))
        .filter((name) => name?.startsWith('Copy example value:')),
    ).toStrictEqual(['Copy example value: cookies: foo=abc\nbar=dark'])
    wrapper.unmount()
  })

  it.each([undefined, {}, { pending: { $ref: '#/components/examples/Pending' } }])(
    'retains schema examples when no explicit example is available: %j',
    (examples) => {
      const wrapper = mount(Header, {
        props: {
          ...baseProps,
          header: coerceValue(HeaderObjectSchema, {
            schema: coerceValue(SchemaObjectSchema, { type: 'string', examples: ['schema sample'] }),
            examples,
          }),
        },
      })
      expect(
        wrapper
          .findAll('button')
          .find((button) => button.attributes('aria-label')?.startsWith('Copy example value:'))
          ?.attributes('aria-label'),
      ).toBe('Copy example value: schema sample')
      wrapper.unmount()
    },
  )

  it.each([false, 0, '', null])('preserves a single falsy header example: %j', (example) => {
    const wrapper = mount(Header, { props: { ...baseProps, header: { example } } })
    expect(
      wrapper
        .findAll('button')
        .find((button) => button.attributes('aria-label')?.startsWith('Copy example value:'))
        ?.attributes('aria-label'),
    ).toBe(`Copy example value: ${example}`)
    wrapper.unmount()
  })

  it.each(['schema', 'content'] as const)(
    'renders selected header and %s extensions with schema precedence',
    (kind) => {
      const wrapper = mount(Header, {
        props: {
          name: 'X-Request-Id',
          eventBus: null,
          orderSchemaPropertiesBy: undefined,
          orderRequiredPropertiesFirst: undefined,
          expandAllSchemaProperties: undefined,
          schemaKeyboardNav: undefined,
          hideModels: undefined,
          showExtensions: ['x-owner', 'x-sensitive'],
          specificationExtension: SpecificationExtension,
          header: {
            'x-owner': 'Gateway team',
            'x-sensitive': true,
            ...(kind === 'schema'
              ? { schema: coerceValue(SchemaObjectSchema, { type: 'string', 'x-sensitive': false }) }
              : {
                  content: {
                    'application/json': {
                      schema: coerceValue(SchemaObjectSchema, { type: 'string', 'x-sensitive': false }),
                    },
                  },
                }),
          },
        },
      })
      expect(wrapper.findAll('code').map((node) => node.text())).toStrictEqual(['"Gateway team"', 'false'])
    },
  )
})
