import { generateClientOptions } from '@scalar/blocks/code-example'
import type { ScalarComboboxOption } from '@scalar/components/combobox'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import SdkInstallationInstructions from './SdkInstallationInstructions.vue'

describe('SdkInstallationInstructions', () => {
  const stubs = {
    ScalarMarkdown: true,
    ScalarIcon: true,
  }

  it('combines SDK tabs with featured clients and broadcasts both selections', async () => {
    const eventBus = createWorkspaceEventBus()
    const listener = vi.fn()
    eventBus.on('workspace:update:selected-client', listener)
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        eventBus,
        selectedClient: 'custom/php',
        clientOptions: generateClientOptions(),
        featuredClients: ['shell/curl', 'node/undici'],
        xScalarSdkInstallation: [{ lang: 'php', label: 'PHP SDK', description: 'Install the PHP SDK' }],
      },
    })
    expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).toStrictEqual(['PHP SDK', 'Shell', 'Node.js'])
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('Install the PHP SDK')
    await wrapper.findAll('[role="tab"]')[1]?.trigger('click')
    expect(listener.mock.calls).toStrictEqual([['shell/curl']])
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('Shell Curl')
    await wrapper.setProps({ selectedClient: 'node/undici' })
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Node.js')
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('Node.js undici')
    await wrapper.findAll('[role="tab"]')[0]?.trigger('click')
    expect(listener.mock.calls).toStrictEqual([['shell/curl'], ['custom/php']])
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('Install the PHP SDK')
    wrapper.unmount()
  })

  it('keeps non-featured clients in More and follows external selections', async () => {
    const eventBus = createWorkspaceEventBus()
    const listener = vi.fn()
    eventBus.on('workspace:update:selected-client', listener)
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        eventBus,
        selectedClient: 'python/requests',
        clientOptions: generateClientOptions(),
        featuredClients: [],
        xScalarSdkInstallation: [{ lang: 'php', description: 'Install PHP' }],
      },
    })
    expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).toStrictEqual(['php'])
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('Python Requests')
    expect(wrapper.findAll('[role="tab"][aria-selected="true"]').length).toBe(0)
    const combobox = wrapper.getComponent({ name: 'ScalarCombobox' })
    const option = (combobox.props('options') as ScalarComboboxOption[]).find((entry) => entry.label === 'Shell Curl')
    expect(option?.label).toBe('Shell Curl')
    await combobox.vm.$emit('update:modelValue', option)
    expect(listener.mock.calls).toStrictEqual([['shell/curl']])
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('Shell Curl')
    await wrapper.setProps({ selectedClient: 'custom/php' })
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('Install PHP')
    wrapper.unmount()
  })

  it('keeps SDK tabs keyboard-reachable after selecting a client from More', async () => {
    const eventBus = createWorkspaceEventBus()
    const listener = vi.fn()
    eventBus.on('workspace:update:selected-client', listener)
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        eventBus,
        clientOptions: generateClientOptions(),
        featuredClients: ['shell/curl'],
        xScalarSdkInstallation: [{ lang: 'php', description: 'Install PHP' }],
      },
    })
    const combobox = wrapper.getComponent({ name: 'ScalarCombobox' })
    const option = (combobox.props('options') as ScalarComboboxOption[]).find(
      (entry) => entry.label === 'Python Requests',
    )
    expect(option?.label).toBe('Python Requests')
    await combobox.vm.$emit('update:modelValue', option)
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('Python Requests')
    const tabStop = wrapper.get('[role="tab"][tabindex="0"]')
    expect(tabStop.text()).toBe('php')
    expect(tabStop.attributes('aria-selected')).toBe('false')
    await tabStop.trigger('keydown', { key: 'Home' })
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('php')
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('Install PHP')
    expect(listener.mock.calls).toStrictEqual([['python/requests'], ['custom/php']])
    wrapper.unmount()
  })

  it('excludes hidden clients and follows selections when featured clients change', async () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        selectedClient: 'node/undici',
        clientOptions: generateClientOptions(['node/undici', 'python/requests']),
        featuredClients: ['shell/curl', 'node/undici'],
        xScalarSdkInstallation: [{ lang: 'php', description: 'Install PHP' }],
      },
    })
    expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).toStrictEqual(['php', 'Node.js'])
    expect(
      (wrapper.getComponent({ name: 'ScalarCombobox' }).props('options') as ScalarComboboxOption[]).some((entry) =>
        entry.label.startsWith('Shell '),
      ),
    ).toBe(false)
    await wrapper.setProps({ featuredClients: ['python/requests', 'node/undici'] })
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Node.js')
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('Node.js undici')
    await wrapper.setProps({ clientOptions: [] })
    expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).toStrictEqual(['php'])
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('Install PHP')
    wrapper.unmount()
  })

  it('uses display labels while preserving language selection', async () => {
    const eventBus = createWorkspaceEventBus()
    const listener = vi.fn()
    eventBus.on('workspace:update:selected-client', listener)
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        eventBus,
        selectedClient: 'custom/typescript',
        xScalarSdkInstallation: [
          { lang: 'TypeScript', label: 'JavaScript SDK', description: 'Install JavaScript' },
          { lang: 'Python', label: 'Python SDK', description: 'Install Python' },
        ],
      },
    })
    expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).toStrictEqual(['JavaScript SDK', 'Python SDK'])
    await wrapper.findAll('[role="tab"]')[1]?.trigger('click')
    expect(listener.mock.calls).toStrictEqual([['custom/python']])
    await wrapper.setProps({
      selectedClient: 'custom/python',
      xScalarSdkInstallation: [
        { lang: 'TypeScript', label: 'JS SDK', description: 'Install JavaScript' },
        { lang: 'Python', label: 'Python client library', description: 'Install Python' },
      ],
    })
    const selectedTab = wrapper.get('[role="tab"][aria-selected="true"]')
    expect(selectedTab.text()).toBe('Python client library')
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('Install Python')
    wrapper.unmount()
  })

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

  it('keeps only tab buttons inside the tablist', () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        xScalarSdkInstallation: [
          { lang: 'TypeScript', description: 'Install for TypeScript' },
          { lang: 'Python', description: 'Install for Python' },
        ],
      },
      global: { stubs },
    })

    const tablist = wrapper.find('[role="tablist"]')
    expect(tablist.exists()).toBe(true)
    // aria-required-children: interactive children of a tablist must be tabs
    // (presentation/none on icons is fine)
    const buttons = [...tablist.element.querySelectorAll('button')]
    expect(buttons.length).toBeGreaterThan(0)
    expect(buttons.every((el) => el.getAttribute('role') === 'tab')).toBe(true)
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

  it('broadcasts the matching custom client id when a tab is selected', async () => {
    const eventBus = createWorkspaceEventBus()
    const listener = vi.fn()
    eventBus.on('workspace:update:selected-client', listener)

    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        eventBus,
        xScalarSdkInstallation: [
          { lang: 'TypeScript', description: 'Install for TypeScript' },
          { lang: 'Python', description: 'Install for Python' },
        ],
      },
      global: { stubs },
    })

    // Selecting the Python tab syncs the language-keyed id the operation code
    // samples are keyed by, lower-cased to match across casing differences.
    await wrapper.findAll('[role="tab"]')[1]?.trigger('click')
    expect(listener).toHaveBeenCalledWith('custom/python')
  })

  it('activates the tab that matches the globally selected client', async () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        selectedClient: 'custom/python',
        xScalarSdkInstallation: [
          { lang: 'TypeScript', description: 'Install for TypeScript' },
          { lang: 'Python', description: 'Install for Python' },
        ],
      },
      global: { stubs },
    })

    const tabs = () => wrapper.findAll('[role="tab"]')
    expect(tabs()[1]?.attributes('aria-selected')).toBe('true')

    // A selection change elsewhere moves the active tab to match
    await wrapper.setProps({ selectedClient: 'custom/typescript' })
    expect(tabs()[0]?.attributes('aria-selected')).toBe('true')
  })

  it('follows the selected language when the SDK list is reordered', async () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        selectedClient: 'custom/python',
        xScalarSdkInstallation: [
          { lang: 'TypeScript', description: 'Install for TypeScript' },
          { lang: 'Python', description: 'Install for Python' },
        ],
      },
      global: { stubs },
    })

    const tabs = () => wrapper.findAll('[role="tab"]')
    expect(tabs()[1]?.text()).toBe('Python')
    expect(tabs()[1]?.attributes('aria-selected')).toBe('true')

    // Reordering the list (selection unchanged) must keep the active tab on the
    // selected language, not on its old index — otherwise the intro tab and the
    // operation samples would disagree.
    await wrapper.setProps({
      xScalarSdkInstallation: [
        { lang: 'Python', description: 'Install for Python' },
        { lang: 'TypeScript', description: 'Install for TypeScript' },
      ],
    })

    expect(tabs()[0]?.text()).toBe('Python')
    expect(tabs()[0]?.attributes('aria-selected')).toBe('true')
  })

  it('keeps the current tab when the selected client is not one of its languages', () => {
    const wrapper = mount(SdkInstallationInstructions, {
      props: {
        // A built-in client (or a language without an install entry) leaves the
        // tabs untouched rather than forcing a switch.
        selectedClient: 'js/fetch',
        xScalarSdkInstallation: [
          { lang: 'TypeScript', description: 'Install for TypeScript' },
          { lang: 'Python', description: 'Install for Python' },
        ],
      },
      global: { stubs },
    })

    expect(wrapper.findAll('[role="tab"]')[0]?.attributes('aria-selected')).toBe('true')
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
