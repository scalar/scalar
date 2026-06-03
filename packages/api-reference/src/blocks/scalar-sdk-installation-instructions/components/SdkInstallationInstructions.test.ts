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
    expect(tabs[0]?.text()).toBe('Node')
    expect(tabs[1]?.text()).toBe('Python')
  })

  it('skips entries without a source, description or url', () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        xScalarSdkInstallation: [{ lang: 'Node', source: 'npm install @scalar/sdk' }, { lang: 'Empty' }],
      },
      global: { stubs },
    })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(1)
    expect(tabs[0]?.text()).toBe('Node')
  })

  it('keeps entries that only have a url', () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        xScalarSdkInstallation: [{ lang: 'Node', url: 'https://github.com/scalar/scalar' }],
      },
      global: { stubs },
    })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(1)
    expect(tabs[0]?.text()).toBe('Node')
  })

  it('renders a link with a friendly label for the selected SDK url', () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        xScalarSdkInstallation: [
          { lang: 'Node', source: 'npm install @scalar/sdk', url: 'https://www.npmjs.com/package/@scalar/sdk' },
        ],
      },
      global: { stubs },
    })

    const link = wrapper.get('a[href="https://www.npmjs.com/package/@scalar/sdk"]')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.text()).toBe('View on npm')
  })

  it('does not render a link for unsafe url schemes', () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        xScalarSdkInstallation: [{ lang: 'Node', source: 'npm install @scalar/sdk', url: 'javascript:alert(1)' }],
      },
      global: { stubs },
    })

    expect(wrapper.find('a').exists()).toBe(false)
  })
})
