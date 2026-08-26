import { useModal } from '@scalar/components/modal'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'

import 'fake-indexeddb/auto'

import { createMockEventBus } from '@/v2/helpers/test-utils'

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
 * Helper to wait for async operations and Vue updates.
 */
const waitForUpdates = async () => {
  await nextTick()
  await flushPromises()
}

/**
 * Wires the modal events up to a real sidebar and returns the pieces the tests assert on.
 *
 * The mock event bus records the handlers that are registered, so a test can call them the same way
 * the workspace event bus would when the event is emitted.
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
      webhooks: {
        newPet: { post: { operationId: 'newPetWebhook' } },
      },
    }),
  })

  store.update('x-scalar-active-document', 'test-doc')

  const path = ref<string | undefined>(undefined)
  const method = ref<HttpMethod | undefined>(undefined)
  const exampleName = ref<string | undefined>(undefined)
  const isWebhook = ref(false)

  const route = vi.fn((payload: { path?: string; method?: HttpMethod; example?: string; isWebhook?: boolean }) => {
    path.value = payload.path
    method.value = payload.method
    exampleName.value = payload.example
    isWebhook.value = payload.isWebhook ?? false
  })

  const sidebarState = useModalSidebar({
    workspaceStore: store,
    documentSlug: computed(() => 'test-doc'),
    path: computed(() => path.value),
    method: computed(() => method.value),
    exampleName: computed(() => exampleName.value),
    isWebhook: computed(() => isWebhook.value),
    route,
  })

  const handlers: Record<string, (payload?: unknown) => void> = {}
  const eventBus = createMockEventBus()
  vi.mocked(eventBus.on).mockImplementation((event, handler) => {
    handlers[event] = handler as (payload?: unknown) => void
    return vi.fn()
  })

  const requestBodyCompositionSelection = ref<Record<string, number>>({})
  const modalState = useModal()

  initializeModalEvents({
    eventBus,
    isSidebarOpen: ref(false),
    requestBodyCompositionSelection,
    sidebarState,
    modalState,
    store,
  })

  const getEntryId = (location: { path?: string; method?: HttpMethod; isWebhook?: boolean }) =>
    sidebarState.getEntryByLocation({ document: 'test-doc', method: 'post', ...location })?.id ?? ''

  const openClientModal = async (payload: Record<string, unknown>) => {
    handlers['ui:open:client-modal']?.(payload)
    await waitForUpdates()
  }

  return { getEntryId, modalState, openClientModal, requestBodyCompositionSelection, route }
}

describe('modal-events', () => {
  it('keeps the request body composition selection when the operation is already open', async () => {
    const { getEntryId, openClientModal, requestBodyCompositionSelection, route } = await createTestSetup()
    const id = getEntryId({ path: '/pets' })

    await openClientModal({ id, requestBodyCompositionSelection: { 'requestBody.oneOf': 0 } })

    expect(route).toHaveBeenCalledTimes(1)
    expect(requestBodyCompositionSelection.value).toEqual({ 'requestBody.oneOf': 0 })

    await openClientModal({ id, requestBodyCompositionSelection: { 'requestBody.oneOf': 1 } })

    /**
     * Nothing was routed, so the operation still shows the body the user was working on and the
     * selection that produced it has to survive the second open.
     */
    expect(route).toHaveBeenCalledTimes(1)
    expect(requestBodyCompositionSelection.value).toEqual({ 'requestBody.oneOf': 0 })
  })

  it('keeps the request body composition selection when the webhook is already open', async () => {
    const { getEntryId, openClientModal, requestBodyCompositionSelection } = await createTestSetup()
    const id = getEntryId({ path: 'newPet', isWebhook: true })

    await openClientModal({ id, requestBodyCompositionSelection: { 'requestBody.oneOf': 0 } })
    await openClientModal({ id, requestBodyCompositionSelection: { 'requestBody.oneOf': 1 } })

    /**
     * Webhooks re-route with the same path, method and example instead of bailing out early, so the
     * body on screen does not change either.
     */
    expect(requestBodyCompositionSelection.value).toEqual({ 'requestBody.oneOf': 0 })
  })

  it('applies the request body composition selection when another operation is opened', async () => {
    const { getEntryId, openClientModal, requestBodyCompositionSelection } = await createTestSetup()

    await openClientModal({
      id: getEntryId({ path: '/pets' }),
      requestBodyCompositionSelection: { 'requestBody.oneOf': 0 },
    })
    await openClientModal({
      id: getEntryId({ path: '/users' }),
      requestBodyCompositionSelection: { 'requestBody.oneOf': 1 },
    })

    expect(requestBodyCompositionSelection.value).toEqual({ 'requestBody.oneOf': 1 })
  })

  it('applies the request body composition selection when the modal is closed in between', async () => {
    const { getEntryId, modalState, openClientModal, requestBodyCompositionSelection } = await createTestSetup()
    const id = getEntryId({ path: '/pets' })

    await openClientModal({ id, requestBodyCompositionSelection: { 'requestBody.oneOf': 0 } })

    modalState.hide()

    await openClientModal({ id, requestBodyCompositionSelection: { 'requestBody.oneOf': 1 } })

    expect(requestBodyCompositionSelection.value).toEqual({ 'requestBody.oneOf': 1 })
  })
})
