import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import { PLUGIN_MANAGER_SYMBOL } from '@/plugins/hooks/usePluginManager'
import { createPluginManager } from '@/plugins/plugin-manager'

import SpecificationExtension from './SpecificationExtension.vue'
import { useSpecificationExtensions } from './use-specification-extensions'

vi.unmock('@/plugins/hooks/usePluginManager')

describe('SpecificationExtension', () => {
  it('displays only selected existing extensions once in configuration order', () => {
    const wrapper = mount(SpecificationExtension, {
      props: {
        value: {
          'x-scopes': ['directories', 'directories.readonly'],
          'x-owner': 'team',
          'x-hidden': 'secret',
          summary: 'summary',
        },
        showExtensions: ['x-owner', 'x-missing', 'x-scopes', 'x-owner', 'summary'],
      },
    })
    expect(wrapper.findAll('dt').map((node) => node.text())).toStrictEqual([
      'x-owner:',
      'x-scopes',
      'Array item [0]',
      'Array item [1]',
    ])
    expect(wrapper.findAll('code').map((node) => node.text())).toStrictEqual([
      '"team"',
      '"directories"',
      '"directories.readonly"',
    ])
    expect(wrapper.text()).not.toContain('secret')
  })

  it('renders nothing by default and updates when the selection or operation changes', async () => {
    const wrapper = mount(SpecificationExtension, { props: { value: { 'x-scopes': ['first'] } } })
    expect(wrapper.text()).toBe('')
    await wrapper.setProps({ showExtensions: ['x-scopes'] })
    expect(wrapper.text()).toContain('first')
    await wrapper.setProps({ value: { 'x-scopes': ['second'] } })
    expect(wrapper.findAll('code').map((node) => node.text())).toStrictEqual(['"second"'])
    await wrapper.setProps({ value: {} })
    expect(wrapper.text()).toBe('')
    await wrapper.setProps({ value: { 'x-scopes': ['second'] }, showExtensions: [] })
    expect(wrapper.text()).toBe('')
  })

  it('reuses the parent selection while reacting to extension updates', async () => {
    const value = ref({ 'x-owner': 'Commerce' })
    const manager = createPluginManager({ plugins: [] })
    const getExtensions = vi.spyOn(manager, 'getSpecificationExtensions')
    const wrapper = mount(
      defineComponent({
        setup() {
          const selection = useSpecificationExtensions(
            () => value.value,
            () => ['x-owner'],
          )
          return () =>
            selection.hasExtensions.value ? h(SpecificationExtension, { value: value.value, selection }) : null
        },
      }),
      { global: { provide: { [PLUGIN_MANAGER_SYMBOL]: manager } } },
    )

    expect(wrapper.find('code').text()).toBe('"Commerce"')
    expect(getExtensions).toHaveBeenCalledTimes(1)

    value.value = { 'x-owner': 'Billing' }
    await nextTick()
    expect(wrapper.find('code').text()).toBe('"Billing"')
    expect(getExtensions).toHaveBeenCalledTimes(2)
  })

  it('preserves plugin output without adding a duplicate default value', () => {
    const wrapper = mount(SpecificationExtension, {
      props: { value: { 'x-scopes': ['raw-value'] }, showExtensions: ['x-scopes'] },
      global: {
        provide: {
          [PLUGIN_MANAGER_SYMBOL]: createPluginManager({
            plugins: [
              () => ({
                name: 'scopes',
                extensions: [{ name: 'x-scopes', component: { render: () => 'Custom scopes' } }],
              }),
            ],
          }),
        },
      },
    })
    expect(wrapper.text()).toBe('Custom scopes')
  })
})
