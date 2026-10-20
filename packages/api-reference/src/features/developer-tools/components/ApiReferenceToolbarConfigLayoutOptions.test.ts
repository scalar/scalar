import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ApiReferenceToolbarConfigLayoutOptions from './ApiReferenceToolbarConfigLayoutOptions.vue'

describe('ApiReferenceToolbarConfigLayoutOptions', () => {
  it.each([
    ['expandAllParameters', 'Expand All Parameters', true],
    ['expandAllSchemaProperties', 'Expand All Schema Properties', false],
    ['hideModelNames', 'Hide Model Names', false],
    ['orderRequiredPropertiesFirst', 'Required Properties First', true],
    ['showSidebar', 'Show Sidebar', true],
    ['hideModels', 'Hide Models', false],
  ] as const)('overrides supplied %s in both directions', async (key, label, defaultValue) => {
    const configuration = { [key]: !defaultValue }
    const wrapper = mount(ApiReferenceToolbarConfigLayoutOptions, {
      props: {
        configuration,
        modelValue: {},
        'onUpdate:modelValue': (modelValue) => wrapper.setProps({ modelValue }),
      },
    })
    const toggle = wrapper
      .findAll('label')
      .find((item) => item.text() === label)!
      .get('[role="switch"]')

    expect(toggle.attributes('aria-checked')).toBe(String(!defaultValue))
    await toggle.trigger('click')
    expect(wrapper.props('modelValue')).toStrictEqual({ [key]: defaultValue })
    expect(toggle.attributes('aria-checked')).toBe(String(defaultValue))

    await toggle.trigger('click')
    expect(wrapper.props('modelValue')).toStrictEqual({ [key]: !defaultValue })
    expect(toggle.attributes('aria-checked')).toBe(String(!defaultValue))
    wrapper.unmount()
  })

  it('uses configuration defaults for the new controls', () => {
    const wrapper = mount(ApiReferenceToolbarConfigLayoutOptions)
    const labels = [
      'Expand All Parameters',
      'Expand All Schema Properties',
      'Hide Model Names',
      'Required Properties First',
    ]
    const values = labels.map((label) =>
      wrapper
        .findAll('label')
        .find((item) => item.text() === label)!
        .get('[role="switch"]')
        .attributes('aria-checked'),
    )
    expect(values).toStrictEqual(['true', 'false', 'false', 'true'])
    wrapper.unmount()
  })

  it('preserves unrelated overrides when toggling', async () => {
    const modelValue: Partial<ApiReferenceConfiguration> = { theme: 'moon', orderSchemaPropertiesBy: 'preserve' }
    const wrapper = mount(ApiReferenceToolbarConfigLayoutOptions, {
      props: { modelValue, 'onUpdate:modelValue': (value) => wrapper.setProps({ modelValue: value }) },
    })
    await wrapper
      .findAll('label')
      .find((item) => item.text() === 'Hide Model Names')!
      .get('[role="switch"]')
      .trigger('click')
    expect(wrapper.props('modelValue')).toStrictEqual({
      theme: 'moon',
      orderSchemaPropertiesBy: 'preserve',
      hideModelNames: true,
    })
    wrapper.unmount()
  })
})
