import type { ApiReferenceConfiguration } from '@scalar/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Models from './Models.vue'
import { OpenAPIDocumentSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'

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
  const mockDocument = coerceValue(OpenAPIDocumentSchema, {
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
  })

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

  it('excludes schemas with x-scalar-ignore', () => {
    const documentWithIgnoredSchema = coerceValue(OpenAPIDocumentSchema, {
      ...mockDocument,
      components: {
        schemas: {
          User: {
            type: 'object' as const,
            properties: {
              id: { type: 'string' as const },
              name: { type: 'string' as const },
            },
          },
          ImageUploadedMessage: {
            'x-scalar-ignore': true,
            description: 'Message about an image upload',
            type: 'object' as const,
          },
        },
      },
    })

    const wrapper = mount(Models, {
      props: {
        document: documentWithIgnoredSchema,
        config: mockConfigModern,
      },
    })

    expect(wrapper.text()).toContain('User')
    expect(wrapper.text()).not.toContain('ImageUploadedMessage')
  })

  describe('expandAllModelSections config', () => {
    it('expands all model sections when expandAllModelSections is true', () => {
      const configWithExpandAll: ApiReferenceConfiguration = {
        layout: 'modern',
        expandAllModelSections: true,
      } as ApiReferenceConfiguration

      const wrapper = mount(Models, {
        props: {
          document: mockDocument,
          config: configWithExpandAll,
        },
      })

      // Check that the component renders
      expect(wrapper.text()).toContain('Models')
      expect(wrapper.text()).toContain('User')
      expect(wrapper.text()).toContain('Pet')

      // Find all CompactSection components and verify they have defaultOpen set to true
      const compactSections = wrapper.findAllComponents({ name: 'CompactSection' })
      expect(compactSections.length).toBeGreaterThan(0)

      compactSections.forEach((section) => {
        expect(section.props('defaultOpen')).toBe(true)
      })

      expect(compactSections[0].text()).toContain('nameType')
      expect(compactSections[1].text()).toContain('nameType')
    })

    it('ensures all model sections are closed when expandAllModelSections is false', () => {
      const configWithExpandAll: ApiReferenceConfiguration = {
        layout: 'modern',
      } as ApiReferenceConfiguration

      const wrapper = mount(Models, {
        props: {
          document: mockDocument,
          config: configWithExpandAll,
        },
      })

      // Find all CompactSection components and verify they have defaultOpen set to true
      const compactSections = wrapper.findAllComponents({ name: 'CompactSection' })
      expect(compactSections.length).toBeGreaterThan(0)

      compactSections.forEach((section) => {
        expect(section.props('defaultOpen')).toBe(false)
      })

      expect(compactSections[0].text()).not.toContain('nameType')
      expect(compactSections[1].text()).not.toContain('nameType')
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
  })
})
