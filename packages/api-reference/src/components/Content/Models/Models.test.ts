import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Models from './Models.vue'

// Mock useSidebar composable
vi.mock('@/features/sidebar', () => ({
  useSidebar: vi.fn(() => ({
    collapsedSidebarItems: {
      'model/user': true,
      'model/pet': true,
    },
  })),
}))

// Mock useNavState composable
vi.mock('@/hooks/useNavState', () => ({
  useNavState: vi.fn(() => ({
    getModelId: vi.fn(({ name }: { name: string }) => `model-${name}`),
  })),
}))

describe('Models', () => {
  const mockDocument: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            name: {
              type: 'string',
              description: 'User name',
            },
          },
          required: ['id'],
        },
        Pet: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Pet ID',
            },
            name: {
              type: 'string',
              description: 'Pet name',
            },
          },
        },
      },
    },
  }

  const mockConfigClassic: ApiReferenceConfiguration = {
    layout: 'classic',
  } as ApiReferenceConfiguration

  const mockConfigModern: ApiReferenceConfiguration = {
    layout: 'modern',
  } as ApiReferenceConfiguration

  describe('layout rendering', () => {
    it('renders ClassicLayout when config.layout is classic', () => {
      const wrapper = mount(Models, {
        props: {
          document: mockDocument,
          config: mockConfigClassic,
        },
      })

      // Check that the component renders and contains "Models" text
      expect(wrapper.text()).toContain('Models')

      // Check that it contains schema names
      expect(wrapper.text()).toContain('User')
      expect(wrapper.text()).toContain('Pet')
      expect(wrapper.findComponent({ name: 'ClassicLayout' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'ModernLayout' }).exists()).toBe(false)
    })

    it('renders ModernLayout when config.layout is modern', () => {
      const wrapper = mount(Models, {
        props: {
          document: mockDocument,
          config: mockConfigModern,
        },
      })

      // Check that the component renders and contains "Models" text
      expect(wrapper.text()).toContain('Models')

      // Check that it contains schema names
      expect(wrapper.text()).toContain('User')
      expect(wrapper.text()).toContain('Pet')
      expect(wrapper.findComponent({ name: 'ClassicLayout' }).exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'ModernLayout' }).exists()).toBe(true)
    })
  })

  describe('props passing', () => {
    it('passes schemas to ClassicLayout', async () => {
      const wrapper = mount(Models, {
        props: {
          document: mockDocument,
          config: mockConfigClassic,
        },
      })

      // Verify that schemas are passed by checking that schema names are rendered
      expect(wrapper.text()).toContain('User')
      expect(wrapper.text()).toContain('Pet')
      expect(wrapper.findComponent({ name: 'ClassicLayout' }).exists()).toBe(true)
    })

    it('passes schemas to ModernLayout', () => {
      const wrapper = mount(Models, {
        props: {
          document: mockDocument,
          config: mockConfigModern,
        },
      })

      // Verify that schemas are passed by checking that schema names are rendered
      expect(wrapper.text()).toContain('User')
      expect(wrapper.text()).toContain('Pet')
      expect(wrapper.findComponent({ name: 'ModernLayout' }).exists()).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('renders nothing if document.components.schemas is undefined', () => {
      const wrapper = mount(Models, {
        props: {
          document: { ...mockDocument, components: {} },
          config: mockConfigClassic,
        },
      })

      expect(wrapper.text()).toBe('')
    })

    it('renders nothing if document.components is undefined', () => {
      const wrapper = mount(Models, {
        props: {
          document: { ...mockDocument, components: undefined },
          config: mockConfigClassic,
        },
      })

      expect(wrapper.text()).toBe('')
    })

    it('renders nothing if document is undefined', () => {
      const wrapper = mount(Models, {
        props: {
          document: undefined as any,
          config: mockConfigClassic,
        },
      })

      expect(wrapper.text()).toBe('')
    })
  })
})
