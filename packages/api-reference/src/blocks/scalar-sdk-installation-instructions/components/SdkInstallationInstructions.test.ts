import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SdkInstallationInstructions from './SdkInstallationInstructions.vue'

describe('SdkInstallationInstructions', () => {
  const stubs = {
    ScalarMarkdown: true,
    ScalarIcon: true,
  }

  it('renders nothing without any SDK installation instructions', () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {},
      global: { stubs },
    })

    expect(wrapper.text()).toBe('')
  })

  it('renders nothing when the SDK list is empty', () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: { xScalarSdkInstallation: [] },
      global: { stubs },
    })

    expect(wrapper.text()).toBe('')
  })

  it('renders a tab for each SDK from x-scalar-sdk-installation', () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        xScalarSdkInstallation: [
          { lang: 'TypeScript', description: 'Install for TypeScript' },
          { lang: 'Python', description: 'Install for Python' },
        ],
      },
      global: { stubs },
    })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(2)
    expect(tabs[0]?.text()).toBe('TypeScript')
    expect(tabs[1]?.text()).toBe('Python')
  })

  it('skips entries without a description', () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        xScalarSdkInstallation: [{ lang: 'TypeScript', description: 'Install for TypeScript' }, { lang: 'Empty' }],
      },
      global: { stubs },
    })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(1)
    expect(tabs[0]?.text()).toBe('TypeScript')
  })

  it('renders the description for the selected SDK', () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        xScalarSdkInstallation: [{ lang: 'TypeScript', description: 'Install for TypeScript' }],
      },
      global: { stubs },
    })

    const panel = wrapper.get('[role="tabpanel"]')
    expect(panel.html()).toContain('Install for TypeScript')
  })
})
