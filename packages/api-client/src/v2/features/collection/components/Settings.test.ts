import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { xScalarEnvironmentSchema } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { OpenAPIDocumentSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import { mockEventBus } from '@/v2/helpers/test-utils'

import Settings from './Settings.vue'

const push = vi.fn()

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push,
  })),
}))

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseEnvironment = coerceValue(xScalarEnvironmentSchema, {
    color: '#FFFFFF',
    variables: [],
  })

  const createWorkspaceStoreInstance = () => {
    const store = createWorkspaceStore()
    store.workspace['x-scalar-theme'] = 'default'
    store.workspace['x-scalar-color-mode'] = 'system'
    store.workspace['x-scalar-active-proxy'] = undefined
    return store
  }

  const createDocumentProps = (overrides: Partial<CollectionProps> = {}) => {
    const document = coerceValue(OpenAPIDocumentSchema, {
      info: {
        title: 'Test API',
        description: 'Test description',
      },
      'x-scalar-original-source-url': 'https://example.com/openapi.json',
      'x-scalar-watch-mode': true,
    })

    return {
      documentSlug: 'test-document',
      document,
      eventBus: mockEventBus,
      layout: 'desktop',
      environment: baseEnvironment,
      workspaceStore: createWorkspaceStoreInstance(),
      activeWorkspace: {
        id: 'test-workspace',
        name: 'Test Workspace',
      },
      collectionType: 'document' as const,
      ...overrides,
    } as CollectionProps & { collectionType: 'document' }
  }

  const createWorkspaceProps = (overrides: Partial<CollectionProps> = {}) => {
    return {
      documentSlug: '',
      document: null,
      eventBus: mockEventBus,
      layout: 'desktop',
      environment: baseEnvironment,
      workspaceStore: createWorkspaceStoreInstance(),
      activeWorkspace: {
        id: 'test-workspace',
        name: 'Test Workspace',
      },
      collectionType: 'workspace' as const,
      ...overrides,
    } as CollectionProps & { collectionType: 'workspace' }
  }

  describe('rendering', () => {
    it('renders DocumentSettings when collectionType is document', () => {
      const props = createDocumentProps()
      const wrapper = mount(Settings, { props })

      const documentSettings = wrapper.findComponent({ name: 'DocumentSettings' })
      expect(documentSettings.exists()).toBe(true)
    })

    it('renders CollectionSettings when collectionType is workspace', () => {
      const props = createWorkspaceProps()
      const wrapper = mount(Settings, { props })

      const collectionSettings = wrapper.findComponent({ name: 'CollectionSettings' })
      expect(collectionSettings.exists()).toBe(true)
    })

    it('passes correct props to DocumentSettings', () => {
      const props = createDocumentProps({
        document: {
          openapi: '3.1.0',
          info: {
            title: 'My API',
            description: 'Test description',
            version: '1.0.0',
          },
          'x-scalar-original-source-url': 'https://api.example.com/spec.json',
          'x-scalar-watch-mode': false,
          'x-scalar-original-document-hash': '123',
        },
        documentSlug: 'my-document',
      })
      const wrapper = mount(Settings, { props })

      const documentSettings = wrapper.findComponent({ name: 'DocumentSettings' })
      expect(documentSettings.props('documentUrl')).toBe('https://api.example.com/spec.json')
      expect(documentSettings.props('title')).toBe('My API')
      expect(documentSettings.props('watchMode')).toBe(false)
      expect(documentSettings.props('isDraftDocument')).toBe(false)
    })

    it('marks DocumentSettings as draft when documentSlug is drafts', () => {
      const props = createDocumentProps({
        documentSlug: 'drafts',
      })
      const wrapper = mount(Settings, { props })

      const documentSettings = wrapper.findComponent({ name: 'DocumentSettings' })
      expect(documentSettings.props('isDraftDocument')).toBe(true)
    })

    it('passes correct props to CollectionSettings', () => {
      const workspaceStore = createWorkspaceStoreInstance()
      workspaceStore.workspace['x-scalar-theme'] = 'purple'
      workspaceStore.workspace['x-scalar-color-mode'] = 'dark'
      workspaceStore.workspace['x-scalar-active-proxy'] = 'https://proxy.example.com'

      const props = createWorkspaceProps({
        workspaceStore,
      })
      const wrapper = mount(Settings, { props })

      const collectionSettings = wrapper.findComponent({ name: 'CollectionSettings' })
      expect(collectionSettings.props('activeThemeId')).toBe('purple')
      expect(collectionSettings.props('colorMode')).toBe('dark')
      expect(collectionSettings.props('activeProxyUrl')).toBe('https://proxy.example.com')
    })

    it('uses default values when workspace properties are undefined', () => {
      const workspaceStore = createWorkspaceStoreInstance()
      delete workspaceStore.workspace['x-scalar-theme']
      delete workspaceStore.workspace['x-scalar-color-mode']
      delete workspaceStore.workspace['x-scalar-active-proxy']

      const props = createWorkspaceProps({
        workspaceStore,
      })
      const wrapper = mount(Settings, { props })

      const collectionSettings = wrapper.findComponent({ name: 'CollectionSettings' })
      expect(collectionSettings.props('activeThemeId')).toBe('default')
      expect(collectionSettings.props('colorMode')).toBe('system')
      expect(collectionSettings.props('activeProxyUrl')).toBeUndefined()
    })

    it('handles missing document properties gracefully', () => {
      const document = coerceValue(OpenAPIDocumentSchema, {
        info: {
          title: 'Test API',
        },
      })

      const props = createDocumentProps({
        document,
      })
      const wrapper = mount(Settings, { props })

      const documentSettings = wrapper.findComponent({ name: 'DocumentSettings' })
      expect(documentSettings.props('documentUrl')).toBeUndefined()
      expect(documentSettings.props('title')).toBe('Test API')
      expect(documentSettings.props('watchMode')).toBe(undefined)
    })
  })

  describe('event handling', () => {
    it('emits document:update:watch-mode when DocumentSettings emits update:watchMode', async () => {
      const props = createDocumentProps()
      const wrapper = mount(Settings, { props })

      const documentSettings = wrapper.findComponent({ name: 'DocumentSettings' })
      await documentSettings.vm.$emit('update:watchMode', false)

      expect(mockEventBus.emit).toHaveBeenCalledWith('document:update:watch-mode', false)
    })

    it('emits workspace:update:theme when CollectionSettings emits update:themeId', async () => {
      const props = createWorkspaceProps()
      const wrapper = mount(Settings, { props })

      const collectionSettings = wrapper.findComponent({ name: 'CollectionSettings' })
      await collectionSettings.vm.$emit('update:themeId', 'purple')

      expect(mockEventBus.emit).toHaveBeenCalledWith('workspace:update:theme', 'purple')
    })

    it('emits workspace:update:active-proxy when CollectionSettings emits update:proxyUrl', async () => {
      const props = createWorkspaceProps()
      const wrapper = mount(Settings, { props })

      const collectionSettings = wrapper.findComponent({ name: 'CollectionSettings' })
      await collectionSettings.vm.$emit('update:proxyUrl', 'https://proxy.example.com')

      expect(mockEventBus.emit).toHaveBeenCalledWith('workspace:update:active-proxy', 'https://proxy.example.com')
    })

    it('emits workspace:update:active-proxy with null when proxy is cleared', async () => {
      const props = createWorkspaceProps()
      const wrapper = mount(Settings, { props })

      const collectionSettings = wrapper.findComponent({ name: 'CollectionSettings' })
      await collectionSettings.vm.$emit('update:proxyUrl', null)

      expect(mockEventBus.emit).toHaveBeenCalledWith('workspace:update:active-proxy', null)
    })

    it('emits workspace:update:color-mode when CollectionSettings emits update:colorMode', async () => {
      const props = createWorkspaceProps()
      const wrapper = mount(Settings, { props })

      const collectionSettings = wrapper.findComponent({ name: 'CollectionSettings' })
      await collectionSettings.vm.$emit('update:colorMode', 'dark')

      expect(mockEventBus.emit).toHaveBeenCalledWith('workspace:update:color-mode', 'dark')
    })
  })

  describe('delete document', () => {
    it('calls workspaceStore.deleteDocument and navigates when DocumentSettings emits delete:document', async () => {
      const workspaceStore = createWorkspaceStoreInstance()
      const eventBus = createWorkspaceEventBus()
      const fn = vi.fn()
      eventBus.on('document:delete:document', fn)

      const props = createDocumentProps({
        documentSlug: 'test-document',
        workspaceStore,
        eventBus,
      })
      const wrapper = mount(Settings, { props })

      const documentSettings = wrapper.findComponent({ name: 'DocumentSettings' })
      await documentSettings.vm.$emit('delete:document')

      expect(fn).toHaveBeenCalledWith({ name: 'test-document' })
    })

    it('uses correct workspace ID when navigating after delete', async () => {
      const workspaceStore = createWorkspaceStoreInstance()
      const eventBus = createWorkspaceEventBus()
      const fn = vi.fn()
      eventBus.on('document:delete:document', fn)

      const props = createDocumentProps({
        documentSlug: 'my-doc',
        eventBus,
        workspaceStore,
        activeWorkspace: {
          id: 'custom-workspace',
          label: 'Custom Workspace',
        },
      })
      const wrapper = mount(Settings, { props })

      const documentSettings = wrapper.findComponent({ name: 'DocumentSettings' })
      await documentSettings.vm.$emit('delete:document')

      expect(fn).toHaveBeenCalledWith({ name: 'my-doc' })
    })
  })
})
