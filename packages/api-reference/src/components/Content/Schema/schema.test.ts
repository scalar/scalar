import { SCHEMA_RENDERING_CONTEXT } from '@scalar/blocks/schema'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import { scrollTargetId } from '@/helpers/lazy-bus'
import { PLUGIN_MANAGER_SYMBOL, createPluginManager } from '@/plugins'

import { Schema, SchemaProperty } from './schema'

// Exercise the real plugin integration instead of the suite-wide empty manager.
vi.unmock('@/plugins/hooks/usePluginManager')

const schema = coerceValue(SchemaObjectSchema, {
  type: 'object',
  properties: { address: { type: 'object', properties: { city: { type: 'string' } } } },
})
const extensionSchema = coerceValue(SchemaObjectSchema, { type: 'string', 'x-example': 'Extension content' })
const pluginManager = createPluginManager({
  plugins: [
    () => ({
      name: 'example',
      extensions: [
        {
          name: 'x-example',
          component: defineComponent({
            props: ['xExample'],
            setup: (props) => () => h('p', String(props.xExample)),
          }),
        },
      ],
    }),
  ],
})

describe('schema', () => {
  afterEach(() => {
    scrollTargetId.value = ''
  })

  it.each([Schema, SchemaProperty])(
    'renders registered extensions without an ApiReference parent (%s)',
    (component) => {
      const wrapper = mount(component, {
        props: { schema: extensionSchema, eventBus: null, options: {}, breadcrumb: ['user'] },
        global: { provide: { [PLUGIN_MANAGER_SYMBOL as symbol]: pluginManager } },
      })
      expect(wrapper.text()).toContain('Extension content')
      wrapper.unmount()
    },
  )

  it('expands a standalone Schema when a reference deep link arrives', async () => {
    const wrapper = mount(Schema, {
      props: { schema, eventBus: null, options: {}, breadcrumb: ['user'], additionalProperties: true },
    })
    expect(wrapper.find('[aria-expanded]').attributes('aria-expanded')).toBe('false')
    scrollTargetId.value = 'user.address.city'
    await nextTick()
    expect(wrapper.find('[aria-expanded]').attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('city')
    wrapper.unmount()
  })

  it('preserves an explicitly supplied host navigation target', async () => {
    const target = ref('')
    const wrapper = mount(Schema, {
      props: { schema, eventBus: null, options: {}, breadcrumb: ['user'], additionalProperties: true },
      global: { provide: { [SCHEMA_RENDERING_CONTEXT as symbol]: { scrollTargetId: target } } },
    })
    scrollTargetId.value = 'user.address.city'
    await nextTick()
    expect(wrapper.find('[aria-expanded]').attributes('aria-expanded')).toBe('false')
    target.value = 'user.address.city'
    await nextTick()
    expect(wrapper.find('[aria-expanded]').attributes('aria-expanded')).toBe('true')
    wrapper.unmount()
  })

  it('expands a standalone SchemaProperty when a reference deep link arrives', async () => {
    const wrapper = mount(SchemaProperty, {
      props: { schema, eventBus: null, options: {}, breadcrumb: ['user'] },
    })
    expect(wrapper.find('[aria-expanded]').attributes('aria-expanded')).toBe('false')
    scrollTargetId.value = 'user.address.city'
    await nextTick()
    expect(wrapper.find('[aria-expanded]').attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('city')
    wrapper.unmount()
  })
})
