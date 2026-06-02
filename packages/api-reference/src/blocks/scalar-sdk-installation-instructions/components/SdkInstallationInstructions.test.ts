import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SdkInstallationInstructions from './SdkInstallationInstructions.vue'

describe('SdkInstallationInstructions', () => {
  const stubs = {
    ScalarCodeBlock: true,
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
          { lang: 'Node', description: 'Install for Node', source: 'npm install @scalar/sdk' },
          { lang: 'Python', description: 'Install for Python', source: 'pip install scalar-sdk' },
        ],
      },
      global: { stubs },
    })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(2)
    expect(tabs[0]?.text()).toBe('Node SDK')
    expect(tabs[1]?.text()).toBe('Python SDK')
  })

  it('skips entries without a source or description', () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        xScalarSdkInstallation: [{ lang: 'Node', source: 'npm install @scalar/sdk' }, { lang: 'Empty' }],
      },
      global: { stubs },
    })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(1)
    expect(tabs[0]?.text()).toBe('Node SDK')
  })
})
