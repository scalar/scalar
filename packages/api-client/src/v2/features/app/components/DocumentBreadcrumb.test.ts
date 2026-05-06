import type { AppState } from '@scalar/api-client/v2/features/app'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, ref, shallowRef } from 'vue'

import { mockEventBus } from '@/v2/helpers/test-utils'

import DocumentBreadcrumb from './DocumentBreadcrumb.vue'

/**
 * Helper to grab the version-picker combobox specifically. The workspace
 * picker collapses into a plain link button while a document is active on
 * the route, so when the version picker is rendered (registry-backed
 * documents only) it is the only `ScalarCombobox` on the page. Centralising
 * the lookup here keeps the intent obvious at every call site if that
 * affordance ever changes again.
 */
const findVersionCombobox = (wrapper: ReturnType<typeof mount>) => {
  const comboboxes = wrapper.findAllComponents({ name: 'ScalarCombobox' })
  return comboboxes[0]
}

type FakeDocument = Partial<WorkspaceDocument> & {
  'x-scalar-registry-meta'?: {
    namespace: string
    slug: string
    version?: string
    commitHash?: string
    conflictCheckedAgainstHash?: string
    hasConflict?: boolean
  }
  'x-scalar-is-dirty'?: boolean
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
  teamSlug = 'acme',
  workspaceList = [
    { id: 'ws-1', label: 'Acme Workspace', teamSlug: 'acme', slug: 'default' },
    { id: 'ws-2', label: 'Marketing API', teamSlug: 'acme', slug: 'marketing' },
  ],
}: {
  documents: Record<string, FakeDocument>
  activeDocumentName?: string
  isTeamWorkspace?: boolean
  teamSlug?: string
  workspaceList?: Array<{
    id: string
    label: string
    teamSlug: string
    slug: string
  }>
}) => {
  const store = shallowRef({
    workspace: {
      documents,
      get activeDocument() {
        return activeDocumentName ? documents[activeDocumentName] : undefined
      },
    },
  })

  // Build a single grouped picker entry from the workspace list. The
  // breadcrumb does not care how the grouping is shaped (only that it is
  // an array of `{ label?, options }`), so we keep this minimal.
  const workspaceGroups = computed(() => [
    {
      label: isTeamWorkspace ? 'Team Workspaces' : 'Local Workspaces',
      options: workspaceList.map((w) => ({ id: w.id, label: w.label })),
    },
  ])

  const app = {
    store,
    workspace: {
      isTeamWorkspace: computed(() => isTeamWorkspace),
      activeWorkspace: shallowRef({ id: 'ws-1', label: 'Acme Workspace' }),
      // The new combobox in the breadcrumb pulls workspaces from these two
      // accessors. Stubbing them with a small fixed list keeps the tests
      // focused on breadcrumb rendering rather than workspace-state plumbing.
      workspaceList: ref(workspaceList),
      workspaceGroups,
      // Test-double for the shared navigation helper. The real
      // implementation lives in `app-state.ts` and emits `ui:navigate`
      // through the event bus, so we mirror that here so the existing
      // event-bus assertions still cover this code path.
      navigateToWorkspaceGetStarted: (workspaceId: string) => {
        const found = workspaceList.find((w) => w.id === workspaceId)
        if (found) {
          mockEventBus.emit('ui:navigate', {
            page: 'workspace',
            path: 'get-started',
            teamSlug: found.teamSlug,
            workspaceSlug: found.slug,
          })
        }
      },
    },
    activeEntities: {
      documentSlug: ref(activeDocumentName),
      // The breadcrumb derives the literal "Team" / "Local" segment from
      // `isTeamWorkspace`, but the team-slug context is still needed for
      // the placeholder-workspace navigation path.
      teamSlug: ref(isTeamWorkspace ? teamSlug : 'local'),
    },
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
  it('does not surface the "Team" / "Local" scope label inside the breadcrumb itself - the menu trigger owns it', () => {
    // The scope label ("Team" / "Local") moved into the `ScalarMenu`
    // trigger so the menu button reads as the leading breadcrumb segment.
    // The breadcrumb component is responsible only for the segments to
    // the right of the menu, starting with the workspace picker.
    const { app } = createFakeApp({
      documents: {
        pets: { info: { title: 'Pets API', version: '1.0.0' } },
      },
      activeDocumentName: 'pets',
      isTeamWorkspace: true,
    })

    const wrapper = mount(DocumentBreadcrumb, { props: { app } })

    // The workspace label is the first user-visible text in the
    // breadcrumb now, not "Team".
    expect(wrapper.text()).toContain('Acme Workspace')
    expect(wrapper.text()).not.toContain('Team')
    expect(wrapper.text()).not.toContain('Local')
  })

  it('routes to the get-started page of the workspace selected in the combobox', async () => {
    const { app } = createFakeApp({
      documents: {
        pets: { info: { title: 'Pets API', version: '1.0.0' } },
      },
      activeDocumentName: undefined,
      isTeamWorkspace: true,
    })

    const wrapper = mount(DocumentBreadcrumb, { props: { app } })
    vi.mocked(mockEventBus.emit).mockClear()

    const comboboxes = wrapper.findAllComponents({ name: 'ScalarCombobox' })
    await comboboxes[0]!.vm.$emit('update:modelValue', {
      id: 'ws-2',
      label: 'Marketing API',
    })

    expect(mockEventBus.emit).toHaveBeenCalledWith('ui:navigate', {
      page: 'workspace',
      path: 'get-started',
      teamSlug: 'acme',
      workspaceSlug: 'marketing',
    })
  })

  it('emits `createWorkspace` when the picker `+` affordance is invoked', () => {
    // `activeDocumentName` is left unset so the workspace picker is in
    // its dropdown form (the link form, used while inside a document, has
    // no `+` affordance).
    const { app } = createFakeApp({
      documents: {
        pets: { info: { title: 'Pets API', version: '1.0.0' } },
      },
      activeDocumentName: undefined,
      isTeamWorkspace: true,
    })

    const wrapper = mount(DocumentBreadcrumb, { props: { app } })

    const workspaceCombobox = wrapper.findAllComponents({
      name: 'ScalarCombobox',
    })[0]!
    workspaceCombobox.vm.$emit('add')

    // The breadcrumb does not own the create-workspace modal; the parent
    // does. We verify the event reaches the parent so the modal can open.
    expect(wrapper.emitted('createWorkspace')).toEqual([[]])
  })

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
    // Registry-backed entries always surface the registry title so the
    // breadcrumb matches what the registry advertises, even when the local
    // workspace document was renamed (info.title 'Pets v1' here).
    expect(wrapper.text()).toContain('Pets API')
    expect(wrapper.text()).not.toContain('Pets v1')
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
    await findVersionCombobox(wrapper)!.vm.$emit('update:modelValue', {
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
        document: {
          openapi: '3.1.0',
          info: { title: 'Pets v2', version: '2.0.0' },
          paths: {},
        },
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

    await findVersionCombobox(wrapper)!.vm.$emit('update:modelValue', {
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

    await findVersionCombobox(wrapper)!.vm.$emit('update:modelValue', {
      id: 'pets-v1',
      label: '1.0.0',
      isLatest: true,
    })
    await flushPromises()

    expect(fetchRegistryDocument).not.toHaveBeenCalled()
    expect(mockEventBus.emit).not.toHaveBeenCalled()
  })

  it('renders the matching status icon for each version row', () => {
    const documents: Record<string, FakeDocument> = {
      'pets-v1': {
        info: { title: 'Pets v1', version: '1.0.0' },
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '1.0.0',
          commitHash: 'old-hash',
        },
      },
      'pets-v2': {
        info: { title: 'Pets v2', version: '2.0.0' },
        'x-scalar-is-dirty': true,
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '2.0.0',
          commitHash: 'matching-hash',
        },
      },
      'pets-v3': {
        info: { title: 'Pets v3', version: '3.0.0' },
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '3.0.0',
          commitHash: 'pets-v3-local',
          conflictCheckedAgainstHash: 'pets-v3-remote',
          hasConflict: true,
        },
      },
    }

    const { app } = createFakeApp({ documents, activeDocumentName: 'pets-v2' })

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
              versions: [
                { version: '3.0.0', commitHash: 'pets-v3-remote' },
                { version: '2.0.0', commitHash: 'matching-hash' },
                { version: '1.0.0', commitHash: 'new-hash' },
              ],
            },
          ],
        },
      },
    })

    const options = findVersionCombobox(wrapper)!.props('options') as Array<{
      id: string
      status: string
    }>

    // The status field on each option drives the row icon. Locking it down
    // here ensures the `synced/push/pull/conflict` mapping survives future
    // refactors of the breadcrumb template.
    expect(options).toEqual([
      expect.objectContaining({ id: 'pets-v3', status: 'conflict' }),
      expect.objectContaining({ id: 'pets-v2', status: 'push' }),
      expect.objectContaining({ id: 'pets-v1', status: 'pull' }),
    ])
  })

  it('kicks off a conflict check for loaded versions whose registry hash drifted and no cache is available', async () => {
    const documents: Record<string, FakeDocument> = {
      'pets-v1': {
        info: { title: 'Pets v1', version: '1.0.0' },
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '1.0.0',
          commitHash: 'old-hash',
        },
      },
    }

    const { app } = createFakeApp({ documents, activeDocumentName: 'pets-v1' })
    // Use a workspace-store stub that exposes `getOriginalDocument` so the
    // conflict-check helper has a baseline to diff against.
    app.store.value = {
      ...createWorkspaceStore(documents, 'pets-v1'),
      getOriginalDocument: vi.fn().mockReturnValue({ info: { title: 'Pets v1', version: '1.0.0' } }),
    } as never

    const fetchRegistryDocument = vi.fn().mockResolvedValue({
      ok: true,
      data: { document: { info: { title: 'Pets v1 Remote', version: '1.0.0' } } },
    })

    mount(DocumentBreadcrumb, {
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
              versions: [{ version: '1.0.0', commitHash: 'new-hash' }],
            },
          ],
        },
      },
    })

    await flushPromises()

    // The breadcrumb fires a conflict check for the registry version it has
    // not seen yet so the cache on `x-scalar-registry-meta` can be populated
    // for subsequent renders.
    expect(fetchRegistryDocument).toHaveBeenCalledWith({
      namespace: 'acme',
      slug: 'pets',
      version: '1.0.0',
    })
  })

  it('hides the version picker (and the create-version affordance) for local documents', () => {
    const { app } = createFakeApp({
      documents: {
        pets: {
          info: { title: 'Pets API', version: '1.0.0' },
        },
      },
      activeDocumentName: 'pets',
    })

    const wrapper = mount(DocumentBreadcrumb, { props: { app } })

    // While inside a document the workspace picker collapses into a plain
    // link button, and the version picker is registry-only. A local
    // document therefore renders neither combobox - asserting on zero
    // here is the strongest possible guard against either picker leaking
    // back in for local documents.
    expect(wrapper.findAllComponents({ name: 'ScalarCombobox' })).toHaveLength(0)
  })

  it('renders the version picker with a create-version slot for registry-backed documents', () => {
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
              versions: [{ version: '1.0.0' }],
            },
          ],
        },
      },
    })

    // The combobox's `add` slot is what renders the "New Version" row in
    // the dropdown. We verify the slot was provided rather than asserting on
    // the rendered popover, which is teleported and only mounted when open.
    const combobox = findVersionCombobox(wrapper)
    expect(combobox?.exists()).toBe(true)
    expect(combobox?.vm.$slots.add).toBeDefined()
  })

  it('creates a draft document with no commit hash and navigates to it on submit', async () => {
    const documents: Record<string, FakeDocument> = {
      'pets-v1': {
        openapi: '3.1.0',
        info: { title: 'Pets API', version: '1.0.0' },
        paths: { '/pets': { get: { summary: 'List pets' } } },
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '1.0.0',
          commitHash: 'seed-hash',
        },
        'x-scalar-is-dirty': true,
      },
    }

    const { app } = createFakeApp({ documents, activeDocumentName: 'pets-v1' })
    const addDocument = vi.fn().mockResolvedValue(true)
    // The helper now branches off the seed via `getEditableDocument`, so
    // expose a stub that returns a deep clone of the requested document.
    const getEditableDocument = vi.fn((name: string) => {
      const doc = documents[name]
      return doc ? (JSON.parse(JSON.stringify(doc)) as Record<string, unknown>) : null
    })
    app.store.value = {
      workspace: {
        documents,
        get activeDocument() {
          return documents['pets-v1']
        },
      },
      addDocument,
      getEditableDocument,
    } as never

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
              versions: [{ version: '1.0.0' }],
            },
          ],
        },
      },
      attachTo: document.body,
    })

    vi.mocked(mockEventBus.emit).mockClear()

    // The "New Version" row is rendered through the combobox's `add` slot.
    // We bypass the teleported popover and emit the same event the slot
    // would, mirroring how the version-select test drives the picker.
    findVersionCombobox(wrapper)!.vm.$emit('add')
    await flushPromises()

    // The modal teleports outside the wrapper, so reach into the document
    // directly to drive the form.
    const textarea = document.querySelector<HTMLTextAreaElement>('textarea')
    expect(textarea).not.toBeNull()
    textarea!.value = '2.0.0'
    textarea!.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    document
      .querySelector<HTMLFormElement>('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(getEditableDocument).toHaveBeenCalledWith('pets-v1')
    expect(addDocument).toHaveBeenCalledTimes(1)
    const [input] = addDocument.mock.calls[0] ?? []
    expect(input.meta['x-scalar-registry-meta']).toEqual({
      namespace: 'acme',
      slug: 'pets',
      version: '2.0.0',
    })
    // No commit hash on a draft - the registry has not seen this version yet.
    expect(input.meta['x-scalar-registry-meta']).not.toHaveProperty('commitHash')
    // The user-typed version flows onto info.version so the rendered
    // OpenAPI matches the registry coordinates, while the rest of the
    // seed body (paths, etc.) is preserved.
    expect(input.document.info).toEqual({ title: 'Pets API', version: '2.0.0' })
    expect(input.document.paths).toEqual({ '/pets': { get: { summary: 'List pets' } } })

    // Routing follows the helper's success path.
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'ui:navigate',
      expect.objectContaining({ page: 'document', path: 'overview' }),
    )

    wrapper.unmount()
  })

  it('does not kick off a conflict check when the cache already covers the current registry hash', async () => {
    const documents: Record<string, FakeDocument> = {
      'pets-v1': {
        info: { title: 'Pets v1', version: '1.0.0' },
        'x-scalar-registry-meta': {
          namespace: 'acme',
          slug: 'pets',
          version: '1.0.0',
          commitHash: 'old-hash',
          // Cache says the conflict was already computed for the registry
          // hash we are about to surface, so the breadcrumb should skip the
          // network call entirely.
          conflictCheckedAgainstHash: 'new-hash',
          hasConflict: true,
        },
      },
    }

    const { app } = createFakeApp({ documents, activeDocumentName: 'pets-v1' })
    app.store.value = {
      ...createWorkspaceStore(documents, 'pets-v1'),
      getOriginalDocument: vi.fn(),
    } as never

    const fetchRegistryDocument = vi.fn()

    mount(DocumentBreadcrumb, {
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
              versions: [{ version: '1.0.0', commitHash: 'new-hash' }],
            },
          ],
        },
      },
    })

    await flushPromises()

    expect(fetchRegistryDocument).not.toHaveBeenCalled()
  })
})
