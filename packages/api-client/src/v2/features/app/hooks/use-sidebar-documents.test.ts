import type { AppState } from '@scalar/api-client/v2/features/app'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import type { TraversedDocument } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'
import { computed, ref, shallowRef } from 'vue'

import { type RegistryDocument, useSidebarDocuments } from '@/v2/features/app/hooks/use-sidebar-documents'

type FakeDocument = Partial<WorkspaceDocument> & {
  'x-scalar-registry-meta'?: { namespace: string; slug: string }
  'x-scalar-navigation'?: TraversedDocument
  info?: { title?: string }
}

/**
 * Creates the tiny slice of `AppState` the hook actually consumes. A full
 * `AppState` is heavy to construct and would pull in router/persistence
 * machinery that is unrelated to the grouping logic exercised here.
 */
const createFakeApp = ({
  documents = {},
  isTeamWorkspace = false,
  documentSlug,
}: {
  documents?: Record<string, FakeDocument>
  isTeamWorkspace?: boolean
  documentSlug?: string
}) => {
  const store = shallowRef({ workspace: { documents } })
  const teamFlag = ref(isTeamWorkspace)
  const slug = ref<string | undefined>(documentSlug)

  const app = {
    store,
    workspace: { isTeamWorkspace: computed(() => teamFlag.value) },
    activeEntities: { documentSlug: slug },
  } as unknown as AppState

  return { app, store, teamFlag, slug }
}

/** Builds a navigation tree entry that matches the shape the hook reads. */
const nav = (name: string, title: string): TraversedDocument =>
  ({
    id: name,
    type: 'document',
    name,
    title,
    children: [],
  }) as unknown as TraversedDocument

describe('use-sidebar-documents', () => {
  it('returns an empty list when the workspace store is not yet available', () => {
    const { app } = createFakeApp({ documents: {} })
    // Simulate a workspace that is still loading by resetting the store.
    app.store.value = null

    const { documents, pinned, rest } = useSidebarDocuments({
      app,
      managedDocs: () => [],
    })

    expect(documents.value).toStrictEqual([])
    expect(pinned.value).toStrictEqual([])
    expect(rest.value).toStrictEqual([])
  })

  it('maps workspace documents to sidebar items on local workspaces', () => {
    const petsNav = nav('pets', 'Pets API')
    const { app } = createFakeApp({
      documents: {
        pets: {
          info: { title: 'Pets API', version: '1.0.0' },
          'x-scalar-navigation': petsNav,
        },
        drafts: { info: { title: 'Drafts', version: '1.0.0' } },
      },
    })

    const { rest } = useSidebarDocuments({ app, managedDocs: () => [] })

    expect(rest.value).toStrictEqual([
      {
        key: 'pets',
        title: 'Pets API',
        documentName: 'pets',
        registry: undefined,
        navigation: petsNav,
        isPinned: false,
      },
      {
        key: 'drafts',
        title: 'Drafts',
        documentName: 'drafts',
        registry: undefined,
        navigation: undefined,
        isPinned: false,
      },
    ])

    // Every entry must have a unique `key` so the sidebar `v-for` does not
    // render duplicate Vue `:key`s.
    const keys = rest.value.map((d) => d.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('falls back to the Untitled when no title is available', () => {
    const { app } = createFakeApp({
      documents: {
        untitled: {},
      },
    })

    const { rest } = useSidebarDocuments({ app, managedDocs: () => [] })

    expect(rest.value[0]?.title).toBe('Untitled')
  })

  it('prefers the navigation title over the info title', () => {
    const { app } = createFakeApp({
      documents: {
        pets: {
          info: { title: 'Info Title', version: '1.0.0' },
          'x-scalar-navigation': nav('pets', 'Navigation Title'),
        },
      },
    })

    const { rest } = useSidebarDocuments({ app, managedDocs: () => [] })

    expect(rest.value[0]?.title).toBe('Navigation Title')
  })

  it('does not merge registry documents or populate the registry field on local workspaces', () => {
    const { app } = createFakeApp({
      documents: {
        pets: {
          info: { title: 'Pets API', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets' },
        },
      },
      isTeamWorkspace: false,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [{ namespace: 'acme', slug: 'orders', title: 'Orders API' }],
    })

    // On local workspaces the sidebar key is derived from the workspace
    // document name (which is guaranteed unique) rather than the registry
    // coordinates. This avoids duplicate Vue `:key`s when two local documents
    // share the same `x-scalar-registry-meta`. `registry` is also left
    // undefined and the registry-only Orders entry is not merged in.
    expect(rest.value).toStrictEqual([
      {
        key: 'pets',
        title: 'Pets API',
        documentName: 'pets',
        registry: undefined,
        navigation: undefined,
        isPinned: false,
      },
    ])
  })

  it('uses the document name as key on local workspaces to avoid collisions when registry meta is duplicated', () => {
    const { app } = createFakeApp({
      documents: {
        'pets-a': {
          info: { title: 'Pets A', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets' },
        },
        'pets-b': {
          info: { title: 'Pets B', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets' },
        },
      },
      isTeamWorkspace: false,
    })

    const { rest } = useSidebarDocuments({ app, managedDocs: () => [] })

    // Both entries must survive and have distinct keys, otherwise Vue would
    // render only one of them under a duplicated `:key`.
    expect(rest.value).toHaveLength(2)
    expect(rest.value.map((d) => d.key)).toStrictEqual(['pets-a', 'pets-b'])
  })

  it('groups team-workspace documents that share the same registry coordinates', () => {
    const { app } = createFakeApp({
      documents: {
        'pets-v1': {
          info: { title: 'Pets v1', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets' },
        },
        'pets-v2': {
          info: { title: 'Pets v2', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets' },
        },
      },
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({ app, managedDocs: () => [] })

    expect(rest.value).toStrictEqual([
      {
        key: '@acme/pets',
        title: 'Pets v1',
        documentName: 'pets-v1',
        registry: { namespace: 'acme', slug: 'pets' },
        navigation: undefined,
        isPinned: false,
        versions: [
          {
            key: 'pets-v2',
            title: 'Pets v2',
            documentName: 'pets-v2',
            navigation: undefined,
          },
        ],
      },
    ])
  })

  it('promotes the active document to primary when it belongs to a group', () => {
    const { app } = createFakeApp({
      documents: {
        'pets-v1': {
          info: { title: 'Pets v1', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets' },
        },
        'pets-v2': {
          info: { title: 'Pets v2', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets' },
        },
      },
      isTeamWorkspace: true,
      documentSlug: 'pets-v2',
    })

    const { rest } = useSidebarDocuments({ app, managedDocs: () => [] })

    expect(rest.value[0]?.documentName).toBe('pets-v2')
    expect(rest.value[0]?.versions).toStrictEqual([
      {
        key: 'pets-v1',
        title: 'Pets v1',
        documentName: 'pets-v1',
        navigation: undefined,
      },
    ])
  })

  it('does not emit a versions array when a group has a single document', () => {
    const { app } = createFakeApp({
      documents: {
        pets: {
          info: { title: 'Pets', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets' },
        },
      },
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({ app, managedDocs: () => [] })

    expect(rest.value[0]?.versions).toBeUndefined()
  })

  it('appends registry-only documents that have not been loaded yet', () => {
    const { app } = createFakeApp({
      documents: {},
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [{ namespace: 'acme', slug: 'pets', title: 'Pets API' }],
    })

    expect(rest.value).toStrictEqual([
      {
        key: '@acme/pets',
        title: 'Pets API',
        registry: { namespace: 'acme', slug: 'pets' },
      },
    ])
  })

  it('skips registry entries that already have a loaded counterpart', () => {
    const { app } = createFakeApp({
      documents: {
        pets: {
          info: { title: 'Pets', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets' },
        },
      },
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [
        { namespace: 'acme', slug: 'pets', title: 'Pets API' },
        { namespace: 'acme', slug: 'orders', title: 'Orders API' },
      ],
    })

    expect(rest.value.map((d) => d.key)).toStrictEqual(['@acme/pets', '@acme/orders'])
  })

  it('falls back to the slug when a registry document has no title', () => {
    const { app } = createFakeApp({
      documents: {},
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [{ namespace: 'acme', slug: 'orders', title: '' }],
    })

    expect(rest.value[0]?.title).toBe('orders')
  })

  it('keeps standalone documents separate from grouped and registry entries', () => {
    const { app } = createFakeApp({
      documents: {
        drafts: { info: { title: 'Drafts', version: '1.0.0' } },
        pets: {
          info: { title: 'Pets', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets' },
        },
      },
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [{ namespace: 'acme', slug: 'orders', title: 'Orders' }],
    })

    // grouped -> registry-only -> standalone
    expect(rest.value.map((d) => d.key)).toStrictEqual(['@acme/pets', '@acme/orders', 'drafts'])
  })

  it('reacts to changes in the managedDocs getter', () => {
    const registry = ref<RegistryDocument[]>([])
    const { app } = createFakeApp({
      documents: {},
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => registry.value,
    })

    expect(rest.value).toStrictEqual([])

    registry.value = [{ namespace: 'acme', slug: 'pets', title: 'Pets API' }]

    expect(rest.value).toStrictEqual([
      {
        key: '@acme/pets',
        title: 'Pets API',
        registry: { namespace: 'acme', slug: 'pets' },
      },
    ])
  })

  it('reacts to toggling the team-workspace flag', () => {
    const { app, teamFlag } = createFakeApp({
      documents: {
        pets: {
          info: { title: 'Pets', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets' },
        },
      },
      isTeamWorkspace: false,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [{ namespace: 'acme', slug: 'orders', title: 'Orders' }],
    })

    // Local: the key comes from the workspace document name (to avoid
    // collisions when multiple local documents share the same registry
    // meta), the `registry` field is undefined, and the registry-only Orders
    // entry is ignored entirely.
    expect(rest.value.map((d) => d.key)).toStrictEqual(['pets'])
    expect(rest.value[0]?.registry).toBeUndefined()

    teamFlag.value = true

    // Team: the Pets document now exposes its registry coordinates and the
    // unloaded Orders entry is merged into the list.
    expect(rest.value.map((d) => d.key)).toStrictEqual(['@acme/pets', '@acme/orders'])
    expect(rest.value[0]?.registry).toStrictEqual({
      namespace: 'acme',
      slug: 'pets',
    })
  })

  it('splits pinned and rest based on isPinned (currently no documents are pinned)', () => {
    const { app } = createFakeApp({
      documents: {
        pets: { info: { title: 'Pets', version: '1.0.0' } },
      },
    })

    const { documents, pinned, rest } = useSidebarDocuments({
      app,
      managedDocs: () => [],
    })

    // The hook currently returns `isPinned: false` for every entry, so every
    // document lives under `rest`. This test pins that contract so we notice
    // if pinning is reintroduced without updating the sidebar consumers.
    expect(pinned.value).toStrictEqual([])
    expect(rest.value).toStrictEqual(documents.value)
  })
})
