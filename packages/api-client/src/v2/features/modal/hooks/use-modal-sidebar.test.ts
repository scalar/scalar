import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'

import 'fake-indexeddb/auto'

import { useModalSidebar } from './use-modal-sidebar'

/**
 * Creates a test document with sensible defaults.
 */
const getDocument = (overrides: Partial<OpenApiDocument> = {}): OpenApiDocument => ({
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
  'x-scalar-original-document-hash': 'test-hash',
  ...overrides,
})

/**
 * Helper to wait for async operations and Vue updates.
 */
const waitForUpdates = async () => {
  await nextTick()
  await flushPromises()
}

/**
 * Creates a standard workspace store with a test document.
 */
const createTestStore = async (documentOverrides: Partial<OpenApiDocument> = {}) => {
  const store = createWorkspaceStore()

  await store.addDocument({
    name: 'test-doc',
    document: getDocument({
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            operationId: 'getUsers',
          },
          post: { summary: 'Create user', operationId: 'createUser' },
        },
        '/pets': {
          get: { summary: 'Get pets', operationId: 'getPets' },
        },
      },
      ...documentOverrides,
    }),
  })

  store.update('x-scalar-active-document', 'test-doc')

  return store
}

describe('use-modal-sidebar', () => {
  it('creates sidebar state from workspace entries', async () => {
    const store = await createTestStore()
    const documentSlug = computed<string | undefined>(() => 'test-doc')
    const path = computed<string | undefined>(() => undefined)
    const method = computed<'get' | 'post' | undefined>(() => undefined)
    const exampleName = computed<string | undefined>(() => undefined)

    const { state } = useModalSidebar({
      workspaceStore: store,
      documentSlug,
      path,
      method,
      exampleName,
      route: vi.fn(),
    })

    await waitForUpdates()

    /**
     * The sidebar state should be created and contain the document entries.
     */
    expect(state).toBeDefined()
    expect(state.items).toBeDefined()
    expect(state.items.value.length).toBeGreaterThan(0)
  })

  it('returns empty entries when document slug is not set', async () => {
    const store = await createTestStore()
    const documentSlug = computed<string | undefined>(() => undefined)
    const path = computed<string | undefined>(() => undefined)
    const method = computed<'get' | 'post' | undefined>(() => undefined)
    const exampleName = computed<string | undefined>(() => undefined)

    const { state } = useModalSidebar({
      workspaceStore: store,
      documentSlug,
      path,
      method,
      exampleName,
      route: vi.fn(),
    })

    await waitForUpdates()

    /**
     * Should return empty entries when no document is selected.
     */
    expect(state.items.value).toEqual([])
  })

  it('returns empty entries when workspace store is null', async () => {
    const documentSlug = computed<string | undefined>(() => 'test-doc')
    const path = computed<string | undefined>(() => undefined)
    const method = computed<'get' | 'post' | undefined>(() => undefined)
    const exampleName = computed<string | undefined>(() => undefined)

    const { state } = useModalSidebar({
      workspaceStore: null,
      documentSlug,
      path,
      method,
      exampleName,
      route: vi.fn(),
    })

    await waitForUpdates()

    /**
     * Should handle null workspace store gracefully.
     */
    expect(state.items.value).toEqual([])
  })

  it('finds entry by location with path and method', async () => {
    const store = await createTestStore()
    const documentSlug = computed<string | undefined>(() => 'test-doc')
    const path = computed<string | undefined>(() => undefined)
    const method = computed<'get' | 'post' | undefined>(() => undefined)
    const exampleName = computed<string | undefined>(() => undefined)

    const { getEntryByLocation } = useModalSidebar({
      workspaceStore: store,
      documentSlug,
      path,
      method,
      exampleName,
      route: vi.fn(),
    })

    await waitForUpdates()

    /**
     * Should find an operation entry when path and method are provided.
     * Falls back to operation when no example entry exists.
     */
    const entry = getEntryByLocation({
      document: 'test-doc',
      path: '/users',
      method: 'get',
      example: 'default',
    })

    expect(entry).toBeDefined()
    expect(entry?.type).toBe('operation')
  })

  it('falls back to operation when example is not found', async () => {
    const store = await createTestStore()
    const documentSlug = computed<string | undefined>(() => 'test-doc')
    const path = computed<string | undefined>(() => undefined)
    const method = computed<'get' | 'post' | undefined>(() => undefined)
    const exampleName = computed<string | undefined>(() => undefined)

    const { getEntryByLocation } = useModalSidebar({
      workspaceStore: store,
      documentSlug,
      path,
      method,
      exampleName,
      route: vi.fn(),
    })

    await waitForUpdates()

    /**
     * Should fall back to operation entry when specified example does not exist.
     */
    const entry = getEntryByLocation({
      document: 'test-doc',
      path: '/users',
      method: 'get',
      example: 'nonexistent-example',
    })

    expect(entry).toBeDefined()
    expect(entry?.type).toBe('operation')
  })

  it('finds operation entry without example', async () => {
    const store = await createTestStore()
    const documentSlug = computed<string | undefined>(() => 'test-doc')
    const path = computed<string | undefined>(() => undefined)
    const method = computed<'get' | 'post' | undefined>(() => undefined)
    const exampleName = computed<string | undefined>(() => undefined)

    const { getEntryByLocation } = useModalSidebar({
      workspaceStore: store,
      documentSlug,
      path,
      method,
      exampleName,
      route: vi.fn(),
    })

    await waitForUpdates()

    /**
     * Should find operation entry when example is not provided.
     */
    const entry = getEntryByLocation({
      document: 'test-doc',
      path: '/pets',
      method: 'get',
    })

    expect(entry).toBeDefined()
    expect(entry?.type).toBe('operation')
  })

  it('returns undefined for non-existent location', async () => {
    const store = await createTestStore()
    const documentSlug = computed<string | undefined>(() => 'test-doc')
    const path = computed<string | undefined>(() => undefined)
    const method = computed<'get' | 'post' | undefined>(() => undefined)
    const exampleName = computed<string | undefined>(() => undefined)

    const { getEntryByLocation } = useModalSidebar({
      workspaceStore: store,
      documentSlug,
      path,
      method,
      exampleName,
      route: vi.fn(),
    })

    await waitForUpdates()

    /**
     * Should return undefined when location does not exist.
     */
    const entry = getEntryByLocation({
      document: 'test-doc',
      path: '/nonexistent',
      method: 'get',
    })

    expect(entry).toBeUndefined()
  })

  it('handles item selection for operation entry', async () => {
    const store = await createTestStore()
    const documentSlug = computed<string | undefined>(() => 'test-doc')
    const path = computed<string | undefined>(() => undefined)
    const method = computed<'get' | 'post' | undefined>(() => undefined)
    const exampleName = computed<string | undefined>(() => undefined)

    const route = vi.fn()

    const { handleSelectItem, getEntryByLocation } = useModalSidebar({
      workspaceStore: store,
      documentSlug,
      path,
      method,
      exampleName,
      route,
    })

    await waitForUpdates()

    /**
     * Should call route with correct parameters when selecting an operation.
     */
    const entry = getEntryByLocation({
      document: 'test-doc',
      path: '/pets',
      method: 'get',
    })

    expect(entry).toBeDefined()
    handleSelectItem(entry!.id)

    expect(route).toHaveBeenCalledWith({
      documentSlug: 'test-doc',
      path: '/pets',
      method: 'get',
      example: 'default',
    })
  })

  it('handles item selection for different operation', async () => {
    const store = await createTestStore()
    const documentSlug = computed<string | undefined>(() => 'test-doc')
    const path = computed<string | undefined>(() => undefined)
    const method = computed<'get' | 'post' | undefined>(() => undefined)
    const exampleName = computed<string | undefined>(() => undefined)

    const route = vi.fn()

    const { handleSelectItem, getEntryByLocation } = useModalSidebar({
      workspaceStore: store,
      documentSlug,
      path,
      method,
      exampleName,
      route,
    })

    await waitForUpdates()

    /**
     * Should call route with default example when selecting a different operation.
     */
    const entry = getEntryByLocation({
      document: 'test-doc',
      path: '/users',
      method: 'post',
    })

    expect(entry).toBeDefined()
    handleSelectItem(entry!.id)

    expect(route).toHaveBeenCalledWith({
      documentSlug: 'test-doc',
      path: '/users',
      method: 'post',
      example: 'default',
    })
  })

  it('toggles expansion when selecting already selected item', async () => {
    const store = await createTestStore()
    const documentSlug = computed<string | undefined>(() => 'test-doc')
    const path = computed<string | undefined>(() => '/pets')
    const method = computed<'get' | 'post' | undefined>(() => 'get')
    const exampleName = computed<string | undefined>(() => 'default')

    const route = vi.fn()

    const { handleSelectItem, state, getEntryByLocation } = useModalSidebar({
      workspaceStore: store,
      documentSlug,
      path,
      method,
      exampleName,
      route,
    })

    await waitForUpdates()

    /**
     * Should toggle expansion instead of routing when selecting an already selected item.
     */
    const entry = getEntryByLocation({
      document: 'test-doc',
      path: '/pets',
      method: 'get',
    })

    expect(entry).toBeDefined()

    // First, manually select the entry to simulate it being already selected
    state.setSelected(entry!.id)
    state.setExpanded(entry!.id, true)

    // Now select the same item again
    handleSelectItem(entry!.id)

    // Route should not be called again since we are toggling expansion
    expect(route).not.toHaveBeenCalled()
    expect(state.isExpanded(entry!.id)).toBe(false)
  })

  it('warns when selecting non-existent entry', async () => {
    const store = await createTestStore()
    const documentSlug = computed<string | undefined>(() => 'test-doc')
    const path = computed<string | undefined>(() => undefined)
    const method = computed<'get' | 'post' | undefined>(() => undefined)
    const exampleName = computed<string | undefined>(() => undefined)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const route = vi.fn()

    const { handleSelectItem } = useModalSidebar({
      workspaceStore: store,
      documentSlug,
      path,
      method,
      exampleName,
      route,
    })

    await waitForUpdates()

    /**
     * Should warn when trying to select a non-existent entry.
     */
    handleSelectItem('non-existent-id')

    expect(warnSpy).toHaveBeenCalledWith('Could not find sidebar entry with id non-existent-id to select')
    expect(route).not.toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  it('toggles expansion for non-operation entries (e.g., tags)', async () => {
    const store = await createTestStore({
      tags: [{ name: 'Users', description: 'User operations' }],
      paths: {
        '/users': {
          get: {
            summary: 'Get users',
            operationId: 'getUsers',
            tags: ['Users'],
          },
        },
      },
    })
    const documentSlug = computed<string | undefined>(() => 'test-doc')
    const path = computed<string | undefined>(() => undefined)
    const method = computed<'get' | 'post' | undefined>(() => undefined)
    const exampleName = computed<string | undefined>(() => undefined)

    const route = vi.fn()

    const { handleSelectItem, state } = useModalSidebar({
      workspaceStore: store,
      documentSlug,
      path,
      method,
      exampleName,
      route,
    })

    await waitForUpdates()

    /**
     * Should toggle expansion for non-operation entries like tags.
     */
    const entries = state.items.value
    const tagEntry = entries.find((e) => e.type === 'tag')

    if (tagEntry) {
      const initialExpanded = state.isExpanded(tagEntry.id)
      handleSelectItem(tagEntry.id)
      expect(state.isExpanded(tagEntry.id)).toBe(!initialExpanded)
      expect(route).not.toHaveBeenCalled()
    }
  })

  it('syncs selection state when route parameters change', async () => {
    const store = await createTestStore()
    const documentSlug = computed<string | undefined>(() => 'test-doc')
    const path = ref<string | undefined>('/users')
    const method = ref<'get' | 'post' | undefined>('get')
    const exampleName = ref<string | undefined>('default')

    const { state, getEntryByLocation } = useModalSidebar({
      workspaceStore: store,
      documentSlug,
      path: computed(() => path.value),
      method: computed(() => method.value),
      exampleName: computed(() => exampleName.value),
      route: vi.fn(),
    })

    await waitForUpdates()

    /**
     * Selection should be in sync with route parameters on initialization.
     */
    const initialEntry = getEntryByLocation({
      document: 'test-doc',
      path: '/users',
      method: 'get',
      example: 'default',
    })

    expect(initialEntry).toBeDefined()
    expect(state.isSelected(initialEntry!.id)).toBe(true)

    /**
     * Changing route parameters should update the selection.
     */
    path.value = '/pets'
    method.value = 'get'
    exampleName.value = undefined

    await waitForUpdates()

    const newEntry = getEntryByLocation({
      document: 'test-doc',
      path: '/pets',
      method: 'get',
    })

    expect(newEntry).toBeDefined()
    expect(state.isSelected(newEntry!.id)).toBe(true)
    expect(state.isSelected(initialEntry!.id)).toBe(false)
  })

  it('resets selection when document is cleared', async () => {
    const store = await createTestStore()
    const documentSlug = ref<string | undefined>('test-doc')
    const path = computed<string | undefined>(() => '/users')
    const method = computed<'get' | 'post' | undefined>(() => 'get')
    const exampleName = computed<string | undefined>(() => 'default')

    const { state, getEntryByLocation } = useModalSidebar({
      workspaceStore: store,
      documentSlug: computed(() => documentSlug.value),
      path,
      method,
      exampleName,
      route: vi.fn(),
    })

    await waitForUpdates()

    /**
     * Initial selection should be set.
     */
    const entry = getEntryByLocation({
      document: 'test-doc',
      path: '/users',
      method: 'get',
      example: 'default',
    })

    expect(entry).toBeDefined()
    expect(state.isSelected(entry!.id)).toBe(true)

    /**
     * Clearing the document should reset the selection.
     */
    documentSlug.value = undefined
    await waitForUpdates()

    expect(state.isSelected(entry!.id)).toBe(false)
  })

  it('expands entry when it is selected via route sync', async () => {
    const store = await createTestStore()
    const documentSlug = computed<string | undefined>(() => 'test-doc')
    const path = computed<string | undefined>(() => '/users')
    const method = computed<'get' | 'post' | undefined>(() => 'get')
    const exampleName = computed<string | undefined>(() => 'default')

    const { state, getEntryByLocation } = useModalSidebar({
      workspaceStore: store,
      documentSlug,
      path,
      method,
      exampleName,
      route: vi.fn(),
    })

    await waitForUpdates()

    /**
     * Entry should be both selected and expanded when synced from route.
     */
    const entry = getEntryByLocation({
      document: 'test-doc',
      path: '/users',
      method: 'get',
      example: 'default',
    })

    expect(entry).toBeDefined()
    expect(state.isSelected(entry!.id)).toBe(true)
    expect(state.isExpanded(entry!.id)).toBe(true)
  })
})
