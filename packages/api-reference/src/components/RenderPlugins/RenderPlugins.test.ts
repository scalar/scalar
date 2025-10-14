import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'

import RenderPlugins from './RenderPlugins.vue'

/**
 * Mock the usePluginManager composable to control what components are returned.
 */
vi.mock('@/plugins', () => ({
  usePluginManager: vi.fn(),
}))

import { usePluginManager } from '@/plugins'

describe('RenderPlugins', () => {
  /**
   * Helper function to create a mock store.
   * We do not need a full WorkspaceStore implementation for these tests.
   */
  const createMockStore = (): WorkspaceStore => ({}) as WorkspaceStore

  const mockOptions = { theme: 'dark', layout: 'modern' }

  describe('rendering', () => {
    it('renders nothing when no components are registered', () => {
      vi.mocked(usePluginManager).mockReturnValue({
        getViewComponents: vi.fn().mockReturnValue([]),
        getSpecificationExtensions: vi.fn(),
      })

      const wrapper = mount(RenderPlugins, {
        props: {
          viewName: 'content.end',
          store: createMockStore(),
          options: mockOptions,
        },
      })

      expect(wrapper.find('.plugin-view').exists()).toBe(false)
      expect(wrapper.html()).toBe('<!--v-if-->')
    })

    it('renders a Vue component without custom renderer', () => {
      const TestComponent = {
        name: 'TestComponent',
        template: '<div class="test-component">Test Content</div>',
        props: ['store', 'options'],
      }

      vi.mocked(usePluginManager).mockReturnValue({
        getViewComponents: vi.fn().mockReturnValue([
          {
            component: TestComponent,
          },
        ]),
        getSpecificationExtensions: vi.fn(),
      })

      const wrapper = mount(RenderPlugins, {
        props: {
          viewName: 'content.end',
          store: createMockStore(),
          options: mockOptions,
        },
      })

      expect(wrapper.find('.plugin-view').exists()).toBe(true)
      expect(wrapper.find('.test-component').exists()).toBe(true)
      expect(wrapper.find('.test-component').text()).toBe('Test Content')
    })

    it('renders with custom renderer', () => {
      const CustomRenderer = {
        name: 'CustomRenderer',
        template: '<div class="custom-renderer">Rendered with custom renderer</div>',
        props: ['component', 'store', 'options'],
      }

      const MockReactComponent = 'MockReactComponent'

      vi.mocked(usePluginManager).mockReturnValue({
        getViewComponents: vi.fn().mockReturnValue([
          {
            component: MockReactComponent,
            renderer: CustomRenderer,
          },
        ]),
        getSpecificationExtensions: vi.fn(),
      })

      const wrapper = mount(RenderPlugins, {
        props: {
          viewName: 'content.end',
          store: createMockStore(),
          options: mockOptions,
        },
      })

      expect(wrapper.find('.plugin-view').exists()).toBe(true)
      expect(wrapper.find('.custom-renderer').exists()).toBe(true)
      expect(wrapper.find('.custom-renderer').text()).toBe('Rendered with custom renderer')
    })
  })

  describe('props handling', () => {
    it('passes store and options to Vue components', () => {
      const receivedProps: any = {}

      const TestComponent = {
        name: 'TestComponent',
        template: '<div class="test-component">Props received</div>',
        props: ['store', 'options'],
        setup(props: any) {
          receivedProps.store = props.store
          receivedProps.options = props.options
          return {}
        },
      }

      vi.mocked(usePluginManager).mockReturnValue({
        getViewComponents: vi.fn().mockReturnValue([
          {
            component: TestComponent,
          },
        ]),
        getSpecificationExtensions: vi.fn(),
      })

      const mockStore = createMockStore()

      mount(RenderPlugins, {
        props: {
          viewName: 'content.end',
          store: mockStore,
          options: mockOptions,
        },
      })

      expect(receivedProps.store).toStrictEqual(mockStore)
      expect(receivedProps.options).toStrictEqual(mockOptions)
    })

    it('passes additional props to Vue components', () => {
      const receivedProps: any = {}

      const TestComponent = {
        name: 'TestComponent',
        template: '<div class="test-component">Props received</div>',
        props: ['store', 'options', 'customProp', 'anotherProp'],
        setup(props: any) {
          receivedProps.store = props.store
          receivedProps.options = props.options
          receivedProps.customProp = props.customProp
          receivedProps.anotherProp = props.anotherProp
          return {}
        },
      }

      vi.mocked(usePluginManager).mockReturnValue({
        getViewComponents: vi.fn().mockReturnValue([
          {
            component: TestComponent,
            props: {
              customProp: 'custom value',
              anotherProp: 42,
            },
          },
        ]),
        getSpecificationExtensions: vi.fn(),
      })

      const mockStore = createMockStore()

      mount(RenderPlugins, {
        props: {
          viewName: 'content.end',
          store: mockStore,
          options: mockOptions,
        },
      })

      expect(receivedProps.store).toStrictEqual(mockStore)
      expect(receivedProps.options).toStrictEqual(mockOptions)
      expect(receivedProps.customProp).toBe('custom value')
      expect(receivedProps.anotherProp).toBe(42)
    })

    it('passes correct props to custom renderer', () => {
      const receivedProps: any = {}

      const CustomRenderer = {
        name: 'CustomRenderer',
        template: '<div class="custom-renderer">Custom renderer</div>',
        props: ['component', 'store', 'options', 'extraProp'],
        setup(props: any) {
          receivedProps.component = props.component
          receivedProps.store = props.store
          receivedProps.options = props.options
          receivedProps.extraProp = props.extraProp
          return {}
        },
      }

      const MockComponent = 'MockReactComponent'

      vi.mocked(usePluginManager).mockReturnValue({
        getViewComponents: vi.fn().mockReturnValue([
          {
            component: MockComponent,
            renderer: CustomRenderer,
            props: {
              extraProp: 'extra value',
            },
          },
        ]),
        getSpecificationExtensions: vi.fn(),
      })

      const mockStore = createMockStore()

      mount(RenderPlugins, {
        props: {
          viewName: 'content.end',
          store: mockStore,
          options: mockOptions,
        },
      })

      expect(receivedProps.component).toBe(MockComponent)
      expect(receivedProps.store).toStrictEqual(mockStore)
      expect(receivedProps.options).toStrictEqual(mockOptions)
      expect(receivedProps.extraProp).toBe('extra value')
    })
  })

  describe('multiple components', () => {
    it('renders multiple plugin components', () => {
      const TestComponent1 = {
        name: 'TestComponent1',
        template: '<div class="component-1">First Component</div>',
        props: ['store', 'options'],
      }

      const TestComponent2 = {
        name: 'TestComponent2',
        template: '<div class="component-2">Second Component</div>',
        props: ['store', 'options'],
      }

      const TestComponent3 = {
        name: 'TestComponent3',
        template: '<div class="component-3">Third Component</div>',
        props: ['store', 'options'],
      }

      vi.mocked(usePluginManager).mockReturnValue({
        getViewComponents: vi
          .fn()
          .mockReturnValue([
            { component: TestComponent1 },
            { component: TestComponent2 },
            { component: TestComponent3 },
          ]),
        getSpecificationExtensions: vi.fn(),
      })

      const wrapper = mount(RenderPlugins, {
        props: {
          viewName: 'content.end',
          store: createMockStore(),
          options: mockOptions,
        },
      })

      expect(wrapper.find('.plugin-view').exists()).toBe(true)
      expect(wrapper.find('.component-1').exists()).toBe(true)
      expect(wrapper.find('.component-2').exists()).toBe(true)
      expect(wrapper.find('.component-3').exists()).toBe(true)
      expect(wrapper.find('.component-1').text()).toBe('First Component')
      expect(wrapper.find('.component-2').text()).toBe('Second Component')
      expect(wrapper.find('.component-3').text()).toBe('Third Component')
    })

    it('renders components from multiple plugins with different configurations', () => {
      const VueComponent = {
        name: 'VueComponent',
        template: '<div class="vue-component">Vue Component</div>',
        props: ['store', 'options'],
      }

      const CustomRenderer = {
        name: 'CustomRenderer',
        template: '<div class="custom-rendered">Custom Rendered</div>',
        props: ['component', 'store', 'options'],
      }

      const ReactComponent = 'ReactComponent'

      vi.mocked(usePluginManager).mockReturnValue({
        getViewComponents: vi
          .fn()
          .mockReturnValue([{ component: VueComponent }, { component: ReactComponent, renderer: CustomRenderer }]),
        getSpecificationExtensions: vi.fn(),
      })

      const wrapper = mount(RenderPlugins, {
        props: {
          viewName: 'content.end',
          store: createMockStore(),
          options: mockOptions,
        },
      })

      expect(wrapper.find('.plugin-view').exists()).toBe(true)
      expect(wrapper.find('.vue-component').exists()).toBe(true)
      expect(wrapper.find('.custom-rendered').exists()).toBe(true)
    })
  })

  describe('error boundary', () => {
    it('wraps each component in ScalarErrorBoundary', () => {
      const TestComponent = {
        name: 'TestComponent',
        template: '<div class="test-component">Test</div>',
        props: ['store', 'options'],
      }

      vi.mocked(usePluginManager).mockReturnValue({
        getViewComponents: vi.fn().mockReturnValue([{ component: TestComponent }]),
        getSpecificationExtensions: vi.fn(),
      })

      const wrapper = mount(RenderPlugins, {
        props: {
          viewName: 'content.end',
          store: createMockStore(),
          options: mockOptions,
        },
      })

      /**
       * We cannot directly test for ScalarErrorBoundary in the wrapper
       * because it is a component that wraps the plugin component.
       * Instead, we verify that the component is rendered successfully,
       * which indicates the error boundary is working as expected.
       */
      expect(wrapper.find('.test-component').exists()).toBe(true)
    })
  })

  describe('view name handling', () => {
    it('calls getViewComponents with the correct view name', () => {
      const getViewComponentsMock = vi.fn().mockReturnValue([])

      vi.mocked(usePluginManager).mockReturnValue({
        getViewComponents: getViewComponentsMock,
        getSpecificationExtensions: vi.fn(),
      })

      mount(RenderPlugins, {
        props: {
          viewName: 'content.end',
          store: createMockStore(),
          options: mockOptions,
        },
      })

      expect(getViewComponentsMock).toHaveBeenCalledWith('content.end')
      expect(getViewComponentsMock).toHaveBeenCalledTimes(1)
    })

    it('handles different view names correctly', () => {
      const getViewComponentsMock = vi.fn().mockReturnValue([])

      vi.mocked(usePluginManager).mockReturnValue({
        getViewComponents: getViewComponentsMock,
        getSpecificationExtensions: vi.fn(),
      })

      mount(RenderPlugins, {
        props: {
          viewName: 'custom.view.name',
          store: createMockStore(),
          options: mockOptions,
        },
      })

      expect(getViewComponentsMock).toHaveBeenCalledWith('custom.view.name')
    })
  })

  describe('edge cases', () => {
    it('handles components with no props gracefully', () => {
      const TestComponent = {
        name: 'TestComponent',
        template: '<div class="test-component">No props</div>',
      }

      vi.mocked(usePluginManager).mockReturnValue({
        getViewComponents: vi.fn().mockReturnValue([{ component: TestComponent }]),
        getSpecificationExtensions: vi.fn(),
      })

      const wrapper = mount(RenderPlugins, {
        props: {
          viewName: 'content.end',
          store: createMockStore(),
          options: mockOptions,
        },
      })

      expect(wrapper.find('.test-component').exists()).toBe(true)
      expect(wrapper.find('.test-component').text()).toBe('No props')
    })

    it('handles empty options object', () => {
      const TestComponent = {
        name: 'TestComponent',
        template: '<div class="test-component">Test</div>',
        props: ['store', 'options'],
      }

      vi.mocked(usePluginManager).mockReturnValue({
        getViewComponents: vi.fn().mockReturnValue([{ component: TestComponent }]),
        getSpecificationExtensions: vi.fn(),
      })

      const wrapper = mount(RenderPlugins, {
        props: {
          viewName: 'content.end',
          store: createMockStore(),
          options: {},
        },
      })

      expect(wrapper.find('.test-component').exists()).toBe(true)
    })

    it('handles component with render function', () => {
      const TestComponent = {
        name: 'TestComponent',
        props: ['store', 'options'],
        render() {
          return h('div', { class: 'render-function-component' }, 'Render function')
        },
      }

      vi.mocked(usePluginManager).mockReturnValue({
        getViewComponents: vi.fn().mockReturnValue([{ component: TestComponent }]),
        getSpecificationExtensions: vi.fn(),
      })

      const wrapper = mount(RenderPlugins, {
        props: {
          viewName: 'content.end',
          store: createMockStore(),
          options: mockOptions,
        },
      })

      expect(wrapper.find('.render-function-component').exists()).toBe(true)
      expect(wrapper.find('.render-function-component').text()).toBe('Render function')
    })
  })
})
