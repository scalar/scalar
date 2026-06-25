import { SCHEMA_EXTENSIONS_RENDERER_SYMBOL, SchemaProperty } from '@scalar/blocks/schema'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

/**
 * The schema tree now lives in `@scalar/blocks/schema` and renders specification
 * extensions through an injected renderer instead of importing the plugin system
 * directly. This guards the contract that keeps the plugin API working: the
 * block forwards each property's value to the host-provided renderer (the API
 * reference provides its plugin-driven `SpecificationExtension` via this same
 * key in `Content.vue`), and renders nothing when no renderer is provided.
 */
describe('schema-property-extension', () => {
  /** Stands in for the API reference's plugin-driven SpecificationExtension. */
  const ExtensionRenderer = defineComponent({
    props: { value: { type: Object, required: true } },
    setup: (props) => () => h('span', `planet: ${(props.value as Record<string, unknown>)['x-defaultPlanet']}`),
  })

  it('forwards a property value to the injected extension renderer', () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        schema: { type: 'string', 'x-defaultPlanet': 'earth' } as never,
        eventBus: null,
        options: {},
      },
      global: {
        provide: {
          [SCHEMA_EXTENSIONS_RENDERER_SYMBOL]: ExtensionRenderer,
        },
      },
    })

    expect(wrapper.text()).toContain('planet: earth')
  })

  it('renders no extension when no renderer is provided', () => {
    // The standalone block has no plugin system, so the extension is simply
    // skipped (no crash) when no renderer is injected.
    const wrapper = mount(SchemaProperty, {
      props: {
        schema: { type: 'string', 'x-defaultPlanet': 'earth' } as never,
        eventBus: null,
        options: {},
      },
    })

    expect(wrapper.text()).not.toContain('planet')
  })
})
