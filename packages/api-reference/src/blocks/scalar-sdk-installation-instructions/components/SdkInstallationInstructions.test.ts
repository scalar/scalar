import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SdkInstallationInstructions from './SdkInstallationInstructions.vue'

describe('SdkInstallationInstructions', () => {
  const stubs = {
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

  it('renders fenced instructions as plain text without syntax highlighting', () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        xScalarSdkInstallation: [
          {
            lang: 'Python',
            description: ['```properties', 'pip install scalar-warp-api', '```'].join('\n'),
          },
        ],
      },
      global: { stubs },
    })

    const panel = wrapper.get('[role="tabpanel"]')
    expect(panel.text()).toBe('pip install scalar-warp-api')
    expect(panel.find('pre').exists()).toBe(false)
    expect(panel.find('code').exists()).toBe(false)
    expect(panel.find('.hljs').exists()).toBe(false)
  })

  it('associates each tab with the panel and labels the panel by the active tab', () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        xScalarSdkInstallation: [
          { lang: 'TypeScript', description: 'Install for TypeScript' },
          { lang: 'Python', description: 'Install for Python' },
        ],
      },
      global: { stubs },
    })

    const firstTab = wrapper.findAll('[role="tab"]')[0]
    const panel = wrapper.get('[role="tabpanel"]')

    expect(firstTab?.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(panel.attributes('aria-labelledby')).toBe(firstTab?.attributes('id'))
  })

  it('keeps a single roving tab stop on the selected tab', async () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        xScalarSdkInstallation: [
          { lang: 'TypeScript', description: 'Install for TypeScript' },
          { lang: 'Python', description: 'Install for Python' },
        ],
      },
      global: { stubs },
    })

    const tabs = () => wrapper.findAll('[role="tab"]')
    expect(tabs().map((tab) => tab.attributes('tabindex'))).toEqual(['0', '-1'])

    // ArrowRight moves the selection (and the tab stop) to the next tab
    await tabs()[0]?.trigger('keydown', { key: 'ArrowRight' })
    expect(tabs().map((tab) => tab.attributes('tabindex'))).toEqual(['-1', '0'])
    expect(tabs()[1]?.attributes('aria-selected')).toBe('true')

    // ArrowRight wraps back around to the first tab
    await tabs()[1]?.trigger('keydown', { key: 'ArrowRight' })
    expect(tabs()[0]?.attributes('aria-selected')).toBe('true')
  })

  it('clamps the selection when the SDK set changes out from under it', async () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        xScalarSdkInstallation: [
          { lang: 'TypeScript', description: 'Install for TypeScript' },
          { lang: 'Python', description: 'Install for Python' },
        ],
      },
      global: { stubs },
    })

    // Select the second tab, then swap in a smaller set where it no longer exists
    await wrapper.findAll('[role="tab"]')[1]?.trigger('click')
    await wrapper.setProps({
      xScalarSdkInstallation: [{ lang: 'Go', description: 'Install for Go' }],
    })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(1)
    expect(tabs[0]?.text()).toBe('Go')
    expect(wrapper.get('[role="tabpanel"]').html()).toContain('Install for Go')
  })
})
