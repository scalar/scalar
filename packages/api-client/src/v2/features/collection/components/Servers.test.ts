import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import Servers from './Servers.vue'

describe('Servers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  const baseDocument = {
    uid: 'doc-1',
    servers: [
      {
        url: 'https://api.example.com',
        description: 'Production Server',
        variables: {
          version: {
            default: 'v1',
            enum: ['v1', 'v2'],
            description: 'API version',
          },
        },
      },
      {
        url: 'https://staging.example.com',
        description: 'Staging Server',
        variables: {},
      },
    ],
  }

  const baseEnvironment = {
    uid: 'env-1',
    name: 'Default',
    color: '#FFFFFF',
    value: '',
    isDefault: true,
  }

  const mountWithProps = (
    custom: Partial<{
      document: any
      environment: any
    }> = {},
  ) => {
    const document = custom.document ?? baseDocument
    const environment = custom.environment ?? baseEnvironment
    const eventBus = createWorkspaceEventBus()

    return {
      wrapper: mount(Servers, {
        props: {
          document,
          environment,
          eventBus,
          securitySchemes: {},
          layout: 'web',
          workspaceStore: createWorkspaceStore(),
          collectionType: 'document',
          documentSlug: 'test-document',
          activeWorkspace: {
            id: 'test-workspace',
            label: 'Test Workspace',
          },
          plugins: [],
        },
      }),
      eventBus,
    }
  }

  it('emits server:add:server event when Add Server button is clicked', async () => {
    const { wrapper, eventBus } = mountWithProps()
    const emitSpy = vi.spyOn(eventBus, 'emit')

    const addButton = wrapper.findAll('button').find((b) => b.text().includes('Add Server'))
    expect(addButton).toBeTruthy()

    await addButton!.trigger('click')

    expect(emitSpy).toHaveBeenCalledWith('server:add:server')
  })

  it('emits server:delete:server event with correct index when deleting a server', async () => {
    const { wrapper, eventBus } = mountWithProps()
    const emitSpy = vi.spyOn(eventBus, 'emit')

    /**
     * Find and click the trash icon button for the first server.
     * The delete modal opens and we confirm deletion.
     */
    const firstDeleteButton = wrapper.find('[data-testid="delete-server-button"]')
    await firstDeleteButton.trigger('click')

    const deleteConfirmButton = wrapper
      .findComponent({ name: 'DeleteSidebarListElement' })
      .find('[data-testid="sidebar-list-element-form-submit-button"]')
    await deleteConfirmButton.trigger('click')

    expect(emitSpy).toHaveBeenCalledWith('server:delete:server', { index: 0 })
  })

  it('emits server:update:server event when server URL or description is updated', async () => {
    const { wrapper, eventBus } = mountWithProps()
    const emitSpy = vi.spyOn(eventBus, 'emit')

    /**
     * Find the Form component and trigger its onUpdate callback.
     * This simulates a user editing the URL field.
     */
    const formComponent = wrapper.findComponent({ name: 'Form' })
    const onUpdate = formComponent.props('onUpdate')

    onUpdate('url', 'https://new-api.example.com')
    await nextTick()

    /** Wait for the debounce to complete */
    await vi.runAllTimersAsync()

    expect(emitSpy).toHaveBeenCalledWith('server:update:server', {
      index: 0,
      server: { url: 'https://new-api.example.com' },
    })
  })

  it('emits server:update:variables event when server variables are updated', async () => {
    const { wrapper, eventBus } = mountWithProps()
    const emitSpy = vi.spyOn(eventBus, 'emit')

    /**
     * Find the ServerVariablesForm component and emit an update event.
     * This simulates a user changing a server variable value.
     */
    const variablesForm = wrapper.findComponent({
      name: 'ServerVariablesForm',
    })
    await variablesForm.vm.$emit('update:variable', 'version', 'v2')
    await nextTick()

    /** Wait for the debounce to complete */
    await vi.runAllTimersAsync()

    expect(emitSpy).toHaveBeenCalledWith('server:update:variables', {
      index: 0,
      key: 'version',
      value: 'v2',
    })
  })

  it('handles empty servers list gracefully and shows Add Server button', () => {
    const { wrapper } = mountWithProps({
      document: {
        uid: 'doc-empty',
        servers: [],
      },
    })

    /**
     * When there are no servers, the component still renders
     * and shows the Add Server button.
     */
    expect(wrapper.exists()).toBe(true)
    const addButton = wrapper.findAll('button').find((b) => b.text().includes('Add Server'))
    expect(addButton).toBeTruthy()

    const formComponents = wrapper.findAllComponents({ name: 'Form' })
    expect(formComponents.length).toBe(0)
  })

  it('debounces multiple rapid server updates to the same field and only emits the last value', async () => {
    const { wrapper, eventBus } = mountWithProps()
    const emitSpy = vi.spyOn(eventBus, 'emit')

    /**
     * Simulate a user rapidly typing in the URL field.
     * Only the final value should be emitted after debounce completes.
     */
    const formComponent = wrapper.findComponent({ name: 'Form' })
    const onUpdate = formComponent.props('onUpdate')

    onUpdate('url', 'https://api1.example.com')
    await nextTick()
    onUpdate('url', 'https://api2.example.com')
    await nextTick()
    onUpdate('url', 'https://api3.example.com')
    await nextTick()

    /** Wait for the debounce to complete */
    await vi.runAllTimersAsync()

    /**
     * Only one call should be made with the final value.
     * The intermediate values should be debounced away.
     */
    const serverUpdateCalls = emitSpy.mock.calls.filter((call) => call[0] === 'server:update:server')
    expect(serverUpdateCalls).toHaveLength(1)
    expect(serverUpdateCalls[0]).toEqual([
      'server:update:server',
      {
        index: 0,
        server: { url: 'https://api3.example.com' },
      },
    ])
  })

  it('debounces updates to different fields independently when keyed by field name', async () => {
    const { wrapper, eventBus } = mountWithProps()
    const emitSpy = vi.spyOn(eventBus, 'emit')

    /**
     * Update both URL and description fields.
     * Since they have different cache keys (index-url vs index-description),
     * both should be emitted independently.
     */
    const formComponent = wrapper.findComponent({ name: 'Form' })
    const onUpdate = formComponent.props('onUpdate')

    onUpdate('url', 'https://new-url.example.com')
    await nextTick()
    onUpdate('description', 'New Description')
    await nextTick()

    /** Wait for the debounce to complete */
    await vi.runAllTimersAsync()

    /**
     * Both updates should be emitted because they have different cache keys.
     */
    const serverUpdateCalls = emitSpy.mock.calls.filter((call) => call[0] === 'server:update:server')
    expect(serverUpdateCalls).toHaveLength(2)
    expect(serverUpdateCalls[0]).toEqual([
      'server:update:server',
      {
        index: 0,
        server: { url: 'https://new-url.example.com' },
      },
    ])
    expect(serverUpdateCalls[1]).toEqual([
      'server:update:server',
      {
        index: 0,
        server: { description: 'New Description' },
      },
    ])
  })
})
