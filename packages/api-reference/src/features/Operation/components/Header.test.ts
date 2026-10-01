import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Header from './Header.vue'

describe('Header', () => {
  it('renders selected header and schema extensions with schema precedence', () => {
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
        header: {
          'x-owner': 'Gateway team',
          'x-sensitive': true,
          schema: coerceValue(SchemaObjectSchema, { type: 'string', 'x-sensitive': false }),
        },
      },
    })
    expect(wrapper.findAll('code').map((node) => node.text())).toStrictEqual(['"Gateway team"', 'false'])
  })
})
