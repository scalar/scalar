import type { AppState } from '@scalar/api-client/v2/features/app'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, ref, shallowRef } from 'vue'

import { mockEventBus } from '@/v2/helpers/test-utils'

import DocumentBreadcrumb from './DocumentBreadcrumb.vue'

type FakeDocument = Partial<WorkspaceDocument> & {
  'x-scalar-registry-meta'?: {
    namespace: string
    slug: string
    version?: string
    commitHash?: string
  }
  info?: { title?: string; version?: string }
}

/**
 * Minimal `AppState` shim. The breadcrumb only reads the workspace store,
 * the active-document slug, the team-workspace flag and the event bus, so a
 * full state object is unnecessary for behaviour-level tests.
 */
const createFakeApp = ({
  documents,
  activeDocumentName,
  isTeamWorkspace = true,
}: {
  documents: Record<string, FakeDocument>
  activeDocumentName?: string
  isTeamWorkspace?: boolean
}) => {
  const store = shallowRef({
    workspace: {
      documents,
      get activeDocument() {
        return activeDocumentName ? documents[activeDocumentName] : undefined
      },
    },
  })

  const app = {
    store,
    workspace: {
      isTeamWorkspace: computed(() => isTeamWorkspace),
      activeWorkspace: shallowRef({ id: 'ws-1', label: 'Acme Workspace' }),
    },
    activeEntities: { documentSlug: ref(activeDocumentName) },
    eventBus: mockEventBus,
  } as unknown as AppState

  return { app }
}

/**
 * Creates a `WorkspaceStore`-shaped stub so the loader's version-dedupe
 * lookup has real document entries to iterate over. `activeDocument` is
 * exposed as a getter so the breadcrumb's registry-meta reader still
 * resolves after the store is swapped for this stub.
 */
const createWorkspaceStore = (documents: Record<string, FakeDocument>, activeDocumentName?: string) =>
  ({
    workspace: {
      documents,
      get activeDocument() {
        return activeDocumentName ? documents[activeDocumentName] : undefined
      },
    },
    addDocument: vi.fn().mockResolvedValue(undefined),
  }) as unknown as WorkspaceStore

describe('DocumentBreadcrumb', () => {
  it('renders only the workspace segment when no document is active on the route', () => {
    const { app } = createFakeApp({
      documents: {
        pets: {
          info: { title: 'Pets API', version: '1.0.0' },
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'pets',
            version: '1.0.0',
          },
        },
      },
      // Route has no document slug — e.g. the user is on the workspace
      // environment or settings page.
      activeDocumentName: undefined,
    })

    const wrapper = mount(DocumentBreadcrumb, { props: { app } })

    expect(wrapper.text()).toContain('Acme Workspace')
    expect(wrapper.text()).not.toContain('Pets API')
    expect(wrapper.find('button[aria-label="Document version"]').exists()).toBe(false)
  })

  it('renders workspace + document for local documents without a version picker', () => {
    const { app } = createFakeApp({
      documents: {
        pets: {
          info: { title: 'Pets API', version: '1.0.0' },
        },
      },
      activeDocumentName: 'pets',
    })

    const wrapper = mount(DocumentBreadcrumb, { props: { app } })

    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.text()).toContain('Acme Workspace')
    // Local documents still surface the document name so the breadcrumb
    // stays useful, but the version picker is registry-only.
    expect(wrapper.text()).toContain('Pets API')
    expect(wrapper.find('button[aria-label="Document version"]').exists()).toBe(false)
  })

  it('renders the document title and the active version for a registry-backed document', () => {
    const { app } = createFakeApp({
      documents: {
        'pets-v1': {
          info: { title: 'Pets v1', version: '1.0.0' },
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'pets',
            version: '1.0.0',
          },
        },
      },
      activeDocumentName: 'pets-v1',
    })

    const wrapper = mount(DocumentBreadcrumb, {
      props: {
        app,
        registryDocuments: {
          status: 'success',
          documents: [
            {
              namespace: 'acme',
              slug: 'pets',
              title: 'Pets API',
              versions: [{ version: '2.0.0' }, { version: '1.0.0' }],
            },
          ],
        },
      },
    })

    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.text()).toContain('Acme Workspace')
    expect(wrapper.text()).toContain('Pets v1')
    expect(wrapper.find('button[aria-label="Document version"]').text()).toContain('1.0.0')
  })

  it('navigates without fetching when the selected version is already loaded', async () => {
    const documents: Record<string, FakeDocument> = {
      'pets-v1': {
        info: { title: 'Pets v1', version: '1.0.0' },
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '1.0.0',
        },
      },
      'pets-v2': {
        info: { title: 'Pets v2', version: '2.0.0' },
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '2.0.0',
        },
      },
    }

    const { app } = createFakeApp({ documents, activeDocumentName: 'pets-v1' })
    const fetchRegistryDocument = vi.fn()

    const wrapper = mount(DocumentBreadcrumb, {
      props: {
        app,
        fetchRegistryDocument,
        registryDocuments: {
          status: 'success',
          documents: [
            {
              namespace: 'acme',
              slug: 'pets',
              title: 'Pets API',
              versions: [{ version: '2.0.0' }, { version: '1.0.0' }],
            },
          ],
        },
      },
    })

    // Direct event emission bypasses HeadlessUI's popover internals while
    // still exercising the same handler the component uses in production.
    await wrapper.findComponent({ name: 'ScalarCombobox' }).vm.$emit('update:modelValue', {
      id: 'pets-v2',
      label: '2.0.0',
      isLatest: true,
    })
    await flushPromises()

    expect(fetchRegistryDocument).not.toHaveBeenCalled()
    expect(mockEventBus.emit).toHaveBeenCalledWith('ui:navigate', {
      page: 'document',
      path: 'overview',
      documentSlug: 'pets-v2',
    })
  })

  it('fetches from the registry and navigates when the selected version is not loaded', async () => {
    const documents: Record<string, FakeDocument> = {
      'pets-v1': {
        info: { title: 'Pets v1', version: '1.0.0' },
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '1.0.0',
        },
      },
    }

    const { app } = createFakeApp({ documents, activeDocumentName: 'pets-v1' })
    // The real app state wraps the workspace store behind a `.value` accessor;
    // swap the shallow-ref payload for a full `WorkspaceStore` stub so the
    // loader's existing-document lookup and `addDocument` call both succeed.
    app.store.value = createWorkspaceStore(documents, 'pets-v1') as never

    const fetchRegistryDocument = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        openapi: '3.1.0',
        info: { title: 'Pets v2', version: '2.0.0' },
        paths: {},
      },
    })

    const wrapper = mount(DocumentBreadcrumb, {
      props: {
        app,
        fetchRegistryDocument,
        registryDocuments: {
          status: 'success',
          documents: [
            {
              namespace: 'acme',
              slug: 'pets',
              title: 'Pets API',
              versions: [{ version: '2.0.0' }, { version: '1.0.0' }],
            },
          ],
        },
      },
    })

    vi.mocked(mockEventBus.emit).mockClear()

    await wrapper.findComponent({ name: 'ScalarCombobox' }).vm.$emit('update:modelValue', {
      // Unloaded versions use the synthesized key so the combobox option id
      // lines up with `SidebarDocumentVersion.key`.
      id: '@acme/pets@2.0.0',
      label: '2.0.0',
      isLatest: true,
    })
    await flushPromises()

    expect(fetchRegistryDocument).toHaveBeenCalledWith({
      namespace: 'acme',
      slug: 'pets',
      version: '2.0.0',
    })
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'ui:navigate',
      expect.objectContaining({ page: 'document', path: 'overview' }),
    )
  })

  it('is a no-op when selecting the version that is already active', async () => {
    const documents: Record<string, FakeDocument> = {
      'pets-v1': {
        info: { title: 'Pets v1', version: '1.0.0' },
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '1.0.0',
        },
      },
    }

    const { app } = createFakeApp({ documents, activeDocumentName: 'pets-v1' })
    const fetchRegistryDocument = vi.fn()

    const wrapper = mount(DocumentBreadcrumb, {
      props: {
        app,
        fetchRegistryDocument,
        registryDocuments: {
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
      },
    })

    vi.mocked(mockEventBus.emit).mockClear()

    await wrapper.findComponent({ name: 'ScalarCombobox' }).vm.$emit('update:modelValue', {
      id: 'pets-v1',
      label: '1.0.0',
      isLatest: true,
    })
    await flushPromises()

    expect(fetchRegistryDocument).not.toHaveBeenCalled()
    expect(mockEventBus.emit).not.toHaveBeenCalled()
  })
})
