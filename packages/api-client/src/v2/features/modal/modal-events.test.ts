import { useModal } from '@scalar/components/modal'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'

import 'fake-indexeddb/auto'

import { useModalSidebar } from './hooks/use-modal-sidebar'
import { initializeModalEvents } from './modal-events'

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
 * Wires up the modal events against a real sidebar and returns the pieces the tests assert on.
 *
 * The event bus is a stub that records the registered handlers, so a test can call them the same
 * way the workspace event bus would when `ui:open:client-modal` is emitted.
 */
const createTestSetup = async () => {
  const store = createWorkspaceStore()

  await store.addDocument({
    name: 'test-doc',
    document: getDocument({
      paths: {
        '/pets': { post: { operationId: 'createPet' } },
        '/users': { post: { operationId: 'createUser' } },
      },
    }),
  })

  store.update('x-scalar-active-document', 'test-doc')

  const path = ref<string | undefined>(undefined)
  const method = ref<HttpMethod | undefined>(undefined)
  const exampleName = ref<string | undefined>(undefined)

  const route = vi.fn((payload: { path?: string; method?: HttpMethod; example?: string }) => {
    path.value = payload.path
    method.value = payload.method
    exampleName.value = payload.example
  })

  const sidebarState = useModalSidebar({
    workspaceStore: store,
    documentSlug: computed(() => 'test-doc'),
    path: computed(() => path.value),
    method: computed(() => method.value),
    exampleName: computed(() => exampleName.value),
    route,
  })

  const handlers: Record<string, (payload?: any) => void> = {}
  const eventBus = {
    on: vi.fn((event: string, handler: (payload?: any) => void) => {
      handlers[event] = handler
      return vi.fn()
    }),
    once: vi.fn(() => vi.fn()),
    off: vi.fn(),
    onAny: vi.fn(() => vi.fn()),
    offAny: vi.fn(),
    emit: vi.fn(() => null),
    flushDebouncedEmits: vi.fn(),
  } as any

  const requestBodyCompositionSelection = ref<Record<string, number>>({})

  initializeModalEvents({
    eventBus,
    isSidebarOpen: ref(false),
    requestBodyCompositionSelection,
    sidebarState,
    modalState: useModal(),
    store,
  })

  const getOperationId = (operationPath: string) =>
    sidebarState.getEntryByLocation({ document: 'test-doc', path: operationPath, method: 'post' })?.id ?? ''

  const openClientModal = async (payload: Record<string, unknown>) => {
    handlers['ui:open:client-modal']?.(payload)
    await nextTick()
    await flushPromises()
  }

  return { getOperationId, openClientModal, requestBodyCompositionSelection, route }
}

describe('modal-events', () => {
  it('keeps the request body composition selection when the operation is already open', async () => {
    const { getOperationId, openClientModal, requestBodyCompositionSelection, route } = await createTestSetup()
    const petsId = getOperationId('/pets')

    await openClientModal({ id: petsId, requestBodyCompositionSelection: { 'requestBody.oneOf': 0 } })

    expect(route).toHaveBeenCalledTimes(1)
    expect(requestBodyCompositionSelection.value).toEqual({ 'requestBody.oneOf': 0 })

    await openClientModal({ id: petsId, requestBodyCompositionSelection: { 'requestBody.oneOf': 1 } })

    /**
     * Nothing was routed, so the operation still shows the body the user was working on and the
     * selection that produced it must survive the second open.
     */
    expect(route).toHaveBeenCalledTimes(1)
    expect(requestBodyCompositionSelection.value).toEqual({ 'requestBody.oneOf': 0 })
  })

  it('applies the request body composition selection when another operation is opened', async () => {
    const { getOperationId, openClientModal, requestBodyCompositionSelection } = await createTestSetup()

    await openClientModal({
      id: getOperationId('/pets'),
      requestBodyCompositionSelection: { 'requestBody.oneOf': 0 },
    })
    await openClientModal({
      id: getOperationId('/users'),
      requestBodyCompositionSelection: { 'requestBody.oneOf': 1 },
    })

    expect(requestBodyCompositionSelection.value).toEqual({ 'requestBody.oneOf': 1 })
  })
})
