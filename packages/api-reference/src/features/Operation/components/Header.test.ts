import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SpecificationExtension from '@/features/specification-extension/SpecificationExtension.vue'

import Header from './Header.vue'

describe('Header', () => {
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
