import { useWorkspace } from '@/store/store'
import { PopoverPanel } from '@headlessui/vue'
import {
  collectionSchema,
  requestSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ServerDropdown from './ServerDropdown.vue'
import ServerDropdownItem from './ServerDropdownItem.vue'

// Mock the useWorkspace composable
vi.mock('@/store/store', () => ({
  useWorkspace: vi.fn(() => ({
    servers: {
      'server-1': { uid: 'server-1', url: 'https://scalar.com' },
      'server-2': { uid: 'server-2', url: 'https://staging.scalar.com' },
    },
    collectionMutators: {
      edit: vi.fn(),
    },
    events: {
      commandPalette: {
        emit: vi.fn(),
      },
    },
    serverMutators: {
      edit: vi.fn(),
    },
  })),
}))

describe('ServerDropdown', () => {
  const defaultProps = {
    collection: collectionSchema.parse({
      uid: 'collection-1',
      servers: ['server-1', 'server-2'],
    }),
    server: serverSchema.parse({
      uid: 'server-1',
      url: 'https://scalar.com',
    }),
    target: 'server-dropdown-test-id',
  }

  beforeEach(() => {
    // create teleport target
    const el = document.createElement('div')
    el.id = 'server-dropdown-test-id'
    document.body.appendChild(el)
  })

  afterEach(() => {
    // clean up
    document.body.innerHTML = ''
  })

  it('renders the server URL correctly', () => {
    const wrapper = mount(ServerDropdown, {
      props: defaultProps,
    })

    expect(wrapper.text()).toContain('https://scalar.com')
  })

  it('removes trailing slash from server URL', () => {
    const wrapper = mount(ServerDropdown, {
      props: {
        ...defaultProps,
        server: {
          uid: 'server-1',
          url: 'https://scalar.com/',
        },
      },
    })

    expect(wrapper.text()).toContain('https://scalar.com')
    expect(wrapper.text()).not.toContain('https://scalar.com/')
  })

  it('should show both servers in the dropdown', async () => {
    const wrapper = mount(ServerDropdown, {
      attrs: {
        id: 'server-dropdown-test-id',
      },
      props: {
        ...defaultProps,
        server: {
          uid: 'server-1',
          url: 'https://scalar.com/',
        },
      },
    })

    const dropdownButton = wrapper
      .findAll('button')
      .filter((node) => node.text() === 'Server: https://scalar.com')
      .at(0)
    await dropdownButton?.trigger('click')

    const items = wrapper.findAllComponents(ServerDropdownItem)

    expect(items[0]?.text()).toContain('https://scalar.com')
    expect(items[1]?.text()).toContain('https://staging.scalar.com')
  })

  it('shows collection label when both request and collection servers exist', async () => {
    const wrapper = mount(ServerDropdown, {
      props: {
        ...defaultProps,
        operation: requestSchema.parse({
          servers: ['server-1'],
        }),
      },
    })

    const dropdownButton = wrapper
      .findAll('button')
      .filter((node) => node.text() === 'Server: https://scalar.com')
      .at(0)
    await dropdownButton?.trigger('click')

    const popover = wrapper.findComponent(PopoverPanel)
    expect(popover.text()).toContain('Collection')
  })

  // it('shows "Add Server" button when not in reference layout', () => {
  //   const wrapper = mount(ServerDropdown, {
  //     props: defaultProps,
  //     global: {
  //       stubs: {
  //         ScalarPopover: true,
  //         ScalarButton: true,
  //         ScalarIcon: true,
  //         ScalarFloatingBackdrop: true,
  //         ServerDropdownItem: true,
  //       },
  //     },
  //   })

  //   expect(wrapper.text()).toContain('Add Server')
  // })

  // it('does not show "Add Server" button in reference layout', () => {
  //   const wrapper = mount(ServerDropdown, {
  //     props: {
  //       ...defaultProps,
  //       layout: 'reference',
  //     },
  //     global: {
  //       stubs: {
  //         ScalarPopover: true,
  //         ScalarButton: true,
  //         ScalarIcon: true,
  //         ScalarFloatingBackdrop: true,
  //         ServerDropdownItem: true,
  //       },
  //     },
  //   })

  //   expect(wrapper.text()).not.toContain('Add Server')
  // })

  // it('emits command palette event when clicking "Add Server"', async () => {
  //   const wrapper = mount(ServerDropdown, {
  //     props: defaultProps,
  //     global: {
  //       stubs: {
  //         ScalarPopover: true,
  //         ScalarButton: true,
  //         ScalarIcon: true,
  //         ScalarFloatingBackdrop: true,
  //         ServerDropdownItem: true,
  //       },
  //     },
  //   })

  //   const addServerButton = wrapper.find('button')
  //   await addServerButton.trigger('click')

  //   const workspace = useWorkspace()
  //   expect(workspace.events.commandPalette.emit).toHaveBeenCalledWith({
  //     commandName: 'Add Server',
  //   })
  // })

  // it('updates server variables correctly', async () => {
  //   const wrapper = mount(ServerDropdown, {
  //     props: {
  //       ...defaultProps,
  //       server: {
  //         uid: 'server-1',
  //         url: 'https://scalar.com',
  //         variables: {
  //           version: { default: 'v1' },
  //         },
  //       },
  //     },
  //     global: {
  //       stubs: {
  //         ScalarPopover: true,
  //         ScalarButton: true,
  //         ScalarIcon: true,
  //         ScalarFloatingBackdrop: true,
  //         ServerDropdownItem: true,
  //       },
  //     },
  //   })

  //   await wrapper.vm.updateServerVariable('version', 'v2')

  //   const workspace = useWorkspace()
  //   expect(workspace.serverMutators.edit).toHaveBeenCalledWith(
  //     'server-1',
  //     'variables',
  //     {
  //       version: { default: 'v2' },
  //     },
  //   )
  // })
})
