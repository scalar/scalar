import { mockEventBus } from '@scalar/api-client/v2/helpers/test-utils'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { xScalarEnvironmentSchema } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { OpenAPIDocumentSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollectionProps } from '@/features/app/helpers/routes'

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
      expect(collectionSettings.props('activeThemeSlug')).toBe('purple')
      expect(collectionSettings.props('colorMode')).toBe('dark')
      expect(collectionSettings.props('activeProxyUrl')).toBe('https://proxy.example.com')
    })

    it('uses none theme slug when workspace properties are undefined', () => {
      const workspaceStore = createWorkspaceStoreInstance()
      delete workspaceStore.workspace['x-scalar-theme']
      delete workspaceStore.workspace['x-scalar-color-mode']
      delete workspaceStore.workspace['x-scalar-active-proxy']

      const props = createWorkspaceProps({
        workspaceStore,
      })
      const wrapper = mount(Settings, { props })

      const collectionSettings = wrapper.findComponent({ name: 'CollectionSettings' })
      expect(collectionSettings.props('activeThemeSlug')).toBe('none')
      expect(collectionSettings.props('colorMode')).toBe('system')
      expect(collectionSettings.props('activeProxyUrl')).toBe(null)
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
      await collectionSettings.vm.$emit('update:themeSlug', 'purple')

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

  const buildRegistryDoc = (version: string, commitHash?: string) =>
    coerceValue(OpenAPIDocumentSchema, {
      info: { title: 'Pets API', version },
      'x-scalar-registry-meta': {
        namespace: 'acme',
        slug: 'pets',
        version,
        ...(commitHash ? { commitHash } : {}),
      },
    })

  /**
   * Builds a stub `RegistryAdapter` shaped just enough for the danger
   * zone to consider itself wired up. Individual tests override the
   * delete callbacks they care about so we keep the mocks minimal.
   */
  const buildRegistryStub = (
    overrides: Partial<NonNullable<CollectionProps['registry']>> = {},
  ): NonNullable<CollectionProps['registry']> => ({
    documents: { status: 'success', documents: [] },
    namespaces: { status: 'success', namespaces: [] },
    fetchDocument: vi.fn(),
    publishDocument: vi.fn(),
    publishVersion: vi.fn(),
    deleteVersion: vi.fn(),
    deleteDocument: vi.fn(),
    ...overrides,
  })

  describe('delete registry version', () => {
    const createRegistryDocumentProps = (overrides: Partial<CollectionProps> = {}) =>
      createDocumentProps({
        documentSlug: 'pets-1-0-0',
        document: buildRegistryDoc('1.0.0', 'abc123'),
        ...overrides,
      } as Partial<CollectionProps>)

    it('hides the registry meta when no registry adapter is wired up', () => {
      const wrapper = mount(Settings, { props: createRegistryDocumentProps() })
      expect(wrapper.findComponent({ name: 'DocumentSettings' }).props('registryMeta')).toBeUndefined()
    })

    it('passes the active registry meta down to DocumentSettings when an adapter is wired up', () => {
      const wrapper = mount(Settings, {
        props: createRegistryDocumentProps({ registry: buildRegistryStub() }),
      })
      const documentSettings = wrapper.findComponent({ name: 'DocumentSettings' })

      // Empty registry listing: the active version is treated as an
      // unpublished draft so the per-version affordance falls back
      // to the local delete flow.
      expect(documentSettings.props('registryMeta')).toEqual({
        namespace: 'acme',
        slug: 'pets',
        version: '1.0.0',
        isVersionPublished: false,
      })
    })

    it('flags the version as published when the registry advertises it', () => {
      const wrapper = mount(Settings, {
        props: createRegistryDocumentProps({
          registry: buildRegistryStub({
            documents: {
              status: 'success',
              documents: [
                {
                  namespace: 'acme',
                  slug: 'pets',
                  title: 'Pets API',
                  versions: [{ version: '1.0.0' }],
                },
              ],
            },
          }),
        }),
      })
      const documentSettings = wrapper.findComponent({ name: 'DocumentSettings' })

      expect(documentSettings.props('registryMeta')).toMatchObject({
        isVersionPublished: true,
      })
    })

    it('treats a locally created version as a draft when the registry only knows sibling versions', () => {
      const wrapper = mount(Settings, {
        props: createRegistryDocumentProps({
          registry: buildRegistryStub({
            documents: {
              status: 'success',
              documents: [
                {
                  namespace: 'acme',
                  slug: 'pets',
                  title: 'Pets API',
                  versions: [{ version: '0.9.0' }],
                },
              ],
            },
          }),
        }),
      })
      const documentSettings = wrapper.findComponent({ name: 'DocumentSettings' })

      expect(documentSettings.props('registryMeta')).toMatchObject({
        isVersionPublished: false,
      })
    })

    it('calls the registry adapter and deletes the local document on success', async () => {
      const eventBus = createWorkspaceEventBus()
      const deleteListener = vi.fn()
      eventBus.on('document:delete:document', deleteListener)
      const deleteVersion = vi.fn().mockResolvedValue({
        ok: true,
        data: {
          namespace: 'acme',
          slug: 'pets',
          version: '1.0.0',
        },
      })
      const refreshDocuments = vi.fn().mockResolvedValue(undefined)
      const done = vi.fn()

      const wrapper = mount(Settings, {
        props: createRegistryDocumentProps({
          eventBus,
          registry: buildRegistryStub({ deleteVersion, refreshDocuments }),
        }),
      })

      const documentSettings = wrapper.findComponent({ name: 'DocumentSettings' })
      await documentSettings.vm.$emit('delete:registryVersion', { done })
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(deleteVersion).toHaveBeenCalledWith({
        namespace: 'acme',
        slug: 'pets',
        version: '1.0.0',
      })
      expect(deleteListener).toHaveBeenCalledWith({ name: 'pets-1-0-0' })
      expect(refreshDocuments).toHaveBeenCalled()
      expect(done).toHaveBeenCalledWith({ ok: true })
    })

    it('surfaces an error message and skips the local delete when the adapter rejects', async () => {
      const eventBus = createWorkspaceEventBus()
      const deleteListener = vi.fn()
      eventBus.on('document:delete:document', deleteListener)
      const deleteVersion = vi.fn().mockResolvedValue({
        ok: false,
        error: 'NOT_FOUND',
      })
      const done = vi.fn()

      const wrapper = mount(Settings, {
        props: createRegistryDocumentProps({
          eventBus,
          registry: buildRegistryStub({ deleteVersion }),
        }),
      })

      const documentSettings = wrapper.findComponent({ name: 'DocumentSettings' })
      await documentSettings.vm.$emit('delete:registryVersion', { done })
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(deleteListener).not.toHaveBeenCalled()
      expect(done).toHaveBeenCalledTimes(1)
      const outcome = done.mock.calls[0]?.[0]
      expect(outcome).toMatchObject({ ok: false })
      expect(outcome.message.toLowerCase()).toContain('no longer available')
    })
  })

  describe('delete registry document', () => {
    it('removes every local document sharing the registry coordinates', async () => {
      const workspaceStore = createWorkspaceStoreInstance()
      workspaceStore.workspace.documents = {
        'pets-1-0-0': buildRegistryDoc('1.0.0'),
        'pets-2-0-0': buildRegistryDoc('2.0.0'),
        'unrelated-doc': coerceValue(OpenAPIDocumentSchema, {
          info: { title: 'Other' },
        }),
      }

      const eventBus = createWorkspaceEventBus()
      const deletedNames: string[] = []
      eventBus.on('document:delete:document', ({ name }) => {
        deletedNames.push(name)
      })
      const deleteDocument = vi.fn().mockResolvedValue({
        ok: true,
        data: { namespace: 'acme', slug: 'pets' },
      })
      const refreshDocuments = vi.fn().mockResolvedValue(undefined)
      const done = vi.fn()

      const wrapper = mount(Settings, {
        props: createDocumentProps({
          documentSlug: 'pets-1-0-0',
          document: buildRegistryDoc('1.0.0'),
          workspaceStore,
          eventBus,
          registry: buildRegistryStub({ deleteDocument, refreshDocuments }),
        } as Partial<CollectionProps>),
      })

      const documentSettings = wrapper.findComponent({ name: 'DocumentSettings' })
      await documentSettings.vm.$emit('delete:registryDocument', { done })
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(deleteDocument).toHaveBeenCalledWith({ namespace: 'acme', slug: 'pets' })
      expect(deletedNames).toContain('pets-1-0-0')
      expect(deletedNames).toContain('pets-2-0-0')
      expect(deletedNames).not.toContain('unrelated-doc')
      expect(refreshDocuments).toHaveBeenCalled()
      expect(done).toHaveBeenCalledWith({ ok: true })
    })

    it('surfaces an error message and skips the local delete when the adapter rejects', async () => {
      const eventBus = createWorkspaceEventBus()
      const deleteListener = vi.fn()
      eventBus.on('document:delete:document', deleteListener)
      const deleteDocument = vi.fn().mockResolvedValue({
        ok: false,
        error: 'UNAUTHORIZED',
      })
      const done = vi.fn()

      const wrapper = mount(Settings, {
        props: createDocumentProps({
          documentSlug: 'pets-1-0-0',
          document: buildRegistryDoc('1.0.0'),
          eventBus,
          registry: buildRegistryStub({ deleteDocument }),
        } as Partial<CollectionProps>),
      })

      const documentSettings = wrapper.findComponent({ name: 'DocumentSettings' })
      await documentSettings.vm.$emit('delete:registryDocument', { done })
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(deleteListener).not.toHaveBeenCalled()
      expect(done).toHaveBeenCalledTimes(1)
      const outcome = done.mock.calls[0]?.[0]
      expect(outcome).toMatchObject({ ok: false })
      expect(outcome.message.toLowerCase()).toContain('not allowed')
    })
  })
})
