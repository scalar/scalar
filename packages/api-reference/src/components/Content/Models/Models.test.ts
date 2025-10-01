import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { OpenAPIDocumentSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSidebar } from '@/v2/blocks/scalar-sidebar-block'
import { createSidebar } from '@/v2/blocks/scalar-sidebar-block/helpers/create-sidebar'

import Models from './Models.vue'

// Mock useSidebar composable
vi.mock('@/v2/blocks/scalar-sidebar-block')

function getModels(workspace: WorkspaceStore) {
  const { items } = useSidebar(workspace)

  const item = items.value.entries.find((i) => i.id === 'models')

  return item && item.type === 'text' ? item : undefined
}

describe('Models', async () => {
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

  const store = createWorkspaceStore()

  const mockConfigClassic = {
    layout: 'classic' as const,
    onShowMore: undefined,
    orderRequiredPropertiesFirst: undefined,
    orderSchemaPropertiesBy: undefined,
    expandAllModelSections: undefined,
  }

  const mockConfigModern = {
    layout: 'modern' as const,
    onShowMore: undefined,
    orderRequiredPropertiesFirst: undefined,
    orderSchemaPropertiesBy: undefined,
    expandAllModelSections: undefined,
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    await store.addDocument({
      name: 'default',
      document: mockDocument,
    })

    vi.mocked(useSidebar).mockReturnValue(createSidebar(store))
  })

  describe('layout rendering', () => {
    it('renders ClassicLayout when config.layout is classic', () => {
      const wrapper = mount(Models, {
        props: {
          models: getModels(store),
          hash: '',
          options: mockConfigClassic,
          schemas: mockDocument.components?.schemas,
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
          models: getModels(store),
          hash: '',
          options: mockConfigModern,
          schemas: mockDocument.components?.schemas,
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
          models: getModels(store),
          hash: '',
          options: mockConfigClassic,
          schemas: mockDocument.components?.schemas,
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
          models: getModels(store),
          hash: '',
          options: mockConfigModern,
          schemas: mockDocument.components?.schemas,
        },
      })

      // Verify that schemas are passed by checking that schema names are rendered
      expect(wrapper.text()).toContain('User')
      expect(wrapper.text()).toContain('Pet')
      expect(wrapper.findComponent({ name: 'ModernLayout' }).exists()).toBe(true)
    })
  })

  it('excludes schemas with x-scalar-ignore', async () => {
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

    const store = createWorkspaceStore()

    await store.addDocument({
      name: 'default',
      document: documentWithIgnoredSchema,
    })
    vi.mocked(useSidebar).mockReturnValue(createSidebar(store))

    const wrapper = mount(Models, {
      props: {
        models: getModels(store),
        hash: '',
        options: mockConfigModern,
        schemas: documentWithIgnoredSchema.components?.schemas,
      },
    })

    expect(wrapper.text()).toContain('User')
    expect(wrapper.text()).not.toContain('ImageUploadedMessage')
  })

  describe('expandAllModelSections config', () => {
    it('expands all model sections when expandAllModelSections is true', () => {
      const configWithExpandAll = {
        ...mockConfigModern,
        expandAllModelSections: true,
      }

      const wrapper = mount(Models, {
        props: {
          models: getModels(store),
          hash: '',
          options: configWithExpandAll,
          schemas: mockDocument.components?.schemas,
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
      const configWithExpandAll = {
        ...mockConfigModern,
        expandAllModelSections: false,
      }

      const wrapper = mount(Models, {
        props: {
          models: getModels(store),
          hash: '',
          options: configWithExpandAll,
          schemas: mockDocument.components?.schemas,
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
    it('renders nothing if sidebar entry is empty', async () => {
      const document = {
        ...mockDocument,
        components: {
          schemas: {},
        },
      }

      const store = createWorkspaceStore()

      await store.addDocument({
        name: 'default',
        document,
      })

      vi.mocked(useSidebar).mockReturnValue(createSidebar(store))

      const wrapper = mount(Models, {
        props: {
          models: getModels(store),
          hash: '',
          options: mockConfigClassic,
          schemas: document.components?.schemas,
        },
      })

      expect(wrapper.text()).toBe('')
    })
  })
})
