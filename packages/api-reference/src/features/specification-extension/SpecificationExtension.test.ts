import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { PLUGIN_MANAGER_SYMBOL } from '@/plugins/hooks/usePluginManager'
import { createPluginManager } from '@/plugins/plugin-manager'

import SpecificationExtension from './SpecificationExtension.vue'

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
      'x-ownerstring',
      'x-scopesarray[2]',
      '[0]string',
      '[1]string',
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
