import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { useSidebarState } from '@/v2/hooks/use-sidebar-state'

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

describe('use-sidebar-state', () => {
  const getDocument = (overrides: Partial<OpenApiDocument>) => {
    return {
      openapi: '3.1.0',
      info: { title: 'Pets', version: '1.0.0' },
      ...overrides,
    }
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    push.mockReset()
  })

  it('synchronizes selection to example and expands on initial match', async () => {
    const document = getDocument({
      paths: {
        '/pets': {
          get: {
            summary: 'List Pets',
            tags: ['pets'],
            parameters: [
              {
                name: 'limit',
                in: 'query',
                description: 'The maximum number of pets to return',
                required: false,
                examples: {
                  'default': {
                    value: 10,
                  },
                },
              },
            ],
            responses: {
              200: {
                description: 'A list of pets',
              },
            },
          },
        },
      },
    })

    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'pets',
      document,
    })

    const workspaceSlug = ref('ws')
    const documentSlug = ref<string | undefined>('pets')
    const path = ref<string | undefined>('/pets')
    const method = ref<'get' | undefined>('get')
    const exampleName = ref<string | undefined>('default')

    const { sidebarState } = useSidebarState({
      workspaceStore: store,
      workspaceSlug,
      documentSlug,
      path,
      method,
      exampleName,
    })

    expect(Object.keys(sidebarState.value.selectedItems.value)).toEqual([
      'pets/tag/pets/get/pets/example/default',
      'pets/tag/pets/get/pets',
      'pets/tag/pets',
      'pets',
    ])

    expect(sidebarState.value.isExpanded('pets/tag/pets/get/pets/example/default')).toBe(true)
  })

  it('navigates to document overview and expands when selecting a document', async () => {
    const document = getDocument({ paths: {} })
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'pets', document })

    const workspaceSlug = ref('ws')
    const documentSlug = ref<string | undefined>(undefined)
    const path = ref<string | undefined>(undefined)
    const method = ref<'get' | undefined>(undefined)
    const exampleName = ref<string | undefined>(undefined)

    const { handleSelectItem, sidebarState } = useSidebarState({
      workspaceStore: store,
      workspaceSlug,
      documentSlug,
      path,
      method,
      exampleName,
    })

    expect(sidebarState.value.isSelected('pets')).toBe(false)
    expect(sidebarState.value.isExpanded('pets')).toBe(false)

    // Document id equals the document name in our navigation
    handleSelectItem('pets')

    expect(sidebarState.value.isSelected('pets')).toBe(true)
    expect(sidebarState.value.isExpanded('pets')).toBe(true)
    expect(push).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith({ name: 'document.overview', params: { documentSlug: 'pets' } })
  })

  it('navigates to example and selects first example when selecting an operation', async () => {
    const document = getDocument({
      paths: {
        '/pets': {
          get: {
            tags: ['pets'],
            parameters: [
              {
                name: 'limit',
                in: 'query',
                examples: { default: { value: 10 } },
              },
            ],
            responses: { 200: { description: 'ok' } },
          },
        },
      },
    })
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'pets', document })

    const workspaceSlug = ref('ws')
    const documentSlug = ref<string | undefined>('pets')
    const path = ref<string | undefined>(undefined)
    const method = ref<'get' | undefined>(undefined)
    const exampleName = ref<string | undefined>(undefined)

    const { handleSelectItem, sidebarState } = useSidebarState({
      workspaceStore: store,
      workspaceSlug,
      documentSlug,
      path,
      method,
      exampleName,
    })

    // Find an operation id from the index
    const allEntries = Array.from(sidebarState.value.index.value.values()) as Array<{
      id: string
      type: string
      path?: string
      method?: string
    }>
    const operation = allEntries.find((e) => e.type === 'operation')
    expect(operation).toBeDefined()
    const operationId = operation!.id

    handleSelectItem(operationId)

    // The first example should be selected and expanded
    expect(sidebarState.value.isSelected('pets/tag/pets/get/pets/example/default')).toBe(true)
    expect(sidebarState.value.isExpanded('pets/tag/pets/get/pets/example/default')).toBe(true)
    expect(push).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith({
      name: 'example',
      params: {
        documentSlug: 'pets',
        pathEncoded: encodeURIComponent('/pets'),
        method: 'get',
        exampleName: 'default',
      },
    })
  })

  it('toggles expansion without navigation when selecting an already selected operation', async () => {
    const document = getDocument({
      paths: { '/pets': { get: { tags: ['pets'], responses: { 200: { description: 'ok' } } } } },
    })
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'pets', document })

    const workspaceSlug = ref('ws')
    const documentSlug = ref<string | undefined>('pets')
    const path = ref<string | undefined>('/pets')
    const method = ref<'get' | undefined>('get')
    const exampleName = ref<string | undefined>(undefined)

    const { handleSelectItem, sidebarState } = useSidebarState({
      workspaceStore: store,
      workspaceSlug,
      documentSlug,
      path,
      method,
      exampleName,
    })

    // Operation should be selected and expanded by the watcher
    const allEntries = Array.from(sidebarState.value.index.value.values()) as Array<{ id: string; type: string }>
    const operation = allEntries.find((e) => e.type === 'operation')!
    expect(sidebarState.value.isSelected(operation.id)).toBe(true)
    expect(sidebarState.value.isExpanded(operation.id)).toBe(true)

    // Selecting the same operation toggles expansion only and does not navigate
    handleSelectItem(operation.id)
    expect(sidebarState.value.isExpanded(operation.id)).toBe(false)
    expect(push).not.toHaveBeenCalled()
  })

  it('navigates to example and expands when selecting an example', async () => {
    const document = getDocument({
      paths: {
        '/pets': {
          get: {
            tags: ['pets'],
            parameters: [{ name: 'p', in: 'query', examples: { default: { value: 1 } } }],
            responses: { 200: { description: 'ok' } },
          },
        },
      },
    })
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'pets', document })

    const workspaceSlug = ref('ws')
    const documentSlug = ref<string | undefined>('pets')
    const path = ref<string | undefined>(undefined)
    const method = ref<'get' | undefined>(undefined)
    const exampleName = ref<string | undefined>(undefined)

    const { handleSelectItem, sidebarState } = useSidebarState({
      workspaceStore: store,
      workspaceSlug,
      documentSlug,
      path,
      method,
      exampleName,
    })

    // Find example id
    const allEntries = Array.from(sidebarState.value.index.value.values()) as Array<{ id: string; type: string }>
    const example = allEntries.find((e) => e.type === 'example')!

    handleSelectItem(example.id)

    expect(sidebarState.value.isSelected(example.id)).toBe(true)
    expect(sidebarState.value.isExpanded(example.id)).toBe(true)
    expect(push).toHaveBeenCalledTimes(1)
    expect(push.mock.calls[0]?.[0]).toMatchObject({ name: 'example' })
  })

  it('warns and does not navigate when selecting an unknown id', async () => {
    const document = getDocument({ paths: {} })
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'pets', document })

    const workspaceSlug = ref('ws')
    const documentSlug = ref<string | undefined>('pets')
    const path = ref<string | undefined>(undefined)
    const method = ref<'get' | undefined>(undefined)
    const exampleName = ref<string | undefined>(undefined)

    const { handleSelectItem } = useSidebarState({
      workspaceStore: store,
      workspaceSlug,
      documentSlug,
      path,
      method,
      exampleName,
    })

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
      return
    })
    handleSelectItem('unknown-id')
    expect(warn).toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('clears selection when document slug becomes undefined', async () => {
    const document = getDocument({
      paths: { '/pets': { get: { tags: ['pets'], responses: { 200: { description: 'ok' } } } } },
    })
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'pets', document })

    const workspaceSlug = ref('ws')
    const documentSlug = ref<string | undefined>('pets')
    const path = ref<string | undefined>('/pets')
    const method = ref<'get' | undefined>('get')
    const exampleName = ref<string | undefined>(undefined)

    const { sidebarState } = useSidebarState({
      workspaceStore: store,
      workspaceSlug,
      documentSlug,
      path,
      method,
      exampleName,
    })

    // Precondition: something is selected
    expect(Object.keys(sidebarState.value.selectedItems.value).length).toBeGreaterThan(0)

    // Clear the document slug
    documentSlug.value = undefined
    await nextTick()

    expect(sidebarState.value.selectedItems.value).toEqual({})
  })

  it('falls back to selecting operation when example does not exist', async () => {
    const document = getDocument({
      paths: { '/pets': { get: { tags: ['pets'], responses: { 200: { description: 'ok' } } } } },
    })
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'pets', document })

    const workspaceSlug = ref('ws')
    const documentSlug = ref<string | undefined>('pets')
    const path = ref<string | undefined>('/pets')
    const method = ref<'get' | undefined>('get')
    const exampleName = ref<string | undefined>('nonexistent')

    const { sidebarState } = useSidebarState({
      workspaceStore: store,
      workspaceSlug,
      documentSlug,
      path,
      method,
      exampleName,
    })

    const allEntries = Array.from(sidebarState.value.index.value.values()) as Array<{ id: string; type: string }>
    const operation = allEntries.find((e) => e.type === 'operation')!
    expect(sidebarState.value.isSelected(operation.id)).toBe(true)
  })

  it('selects only the document when only document slug is provided', async () => {
    const document = getDocument({ paths: {} })
    const store = createWorkspaceStore()
    await store.addDocument({ name: 'pets', document })

    const workspaceSlug = ref('ws')
    const documentSlug = ref<string | undefined>('pets')
    const path = ref<string | undefined>(undefined)
    const method = ref<'get' | undefined>(undefined)
    const exampleName = ref<string | undefined>(undefined)

    const { sidebarState } = useSidebarState({
      workspaceStore: store,
      workspaceSlug,
      documentSlug,
      path,
      method,
      exampleName,
    })

    expect(sidebarState.value.isSelected('pets')).toBe(true)
    // No example or operation ids should be selected
    const selectedIds = Object.keys(sidebarState.value.selectedItems.value)
    expect(selectedIds).toEqual(['pets'])
  })
})
