import type { AppState } from '@scalar/api-client/v2/features/app'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import type { TraversedDocument } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'
import { computed, ref, shallowRef } from 'vue'

import { type RegistryDocument, useSidebarDocuments } from '@/v2/features/app/hooks/use-sidebar-documents'

type FakeDocument = Partial<WorkspaceDocument> & {
  'x-scalar-registry-meta'?: {
    namespace: string
    slug: string
    version?: string
    commitHash?: string
    conflictCheckedAgainstHash?: string
    hasConflict?: boolean
  }
  'x-scalar-navigation'?: TraversedDocument
  'x-scalar-is-dirty'?: boolean
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
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets', version: '1.0.0' },
        },
      },
      isTeamWorkspace: false,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [
        {
          namespace: 'acme',
          slug: 'orders',
          title: 'Orders API',
          versions: [{ version: '1.0.0' }],
        },
      ],
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
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets', version: '1.0.0' },
        },
        'pets-b': {
          info: { title: 'Pets B', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets', version: '2.0.0' },
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
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets', version: '1.0.0' },
        },
        'pets-v2': {
          info: { title: 'Pets v2', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets', version: '2.0.0' },
        },
      },
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [
        {
          namespace: 'acme',
          slug: 'pets',
          title: 'Pets API',
          versions: [{ version: '2.0.0' }, { version: '1.0.0' }],
        },
      ],
    })

    // Single grouped item with both versions surfaced. The first version on
    // the list is the latest advertised by the registry (2.0.0) and becomes
    // the active version because no document slug is currently selected.
    // Every title — parent and version rows — is the registry's title so the
    // sidebar matches what the registry advertises, not the locally loaded
    // workspace titles.
    expect(rest.value).toStrictEqual([
      {
        key: '@acme/pets',
        title: 'Pets API',
        documentName: 'pets-v2',
        registry: { namespace: 'acme', slug: 'pets' },
        navigation: undefined,
        isPinned: false,
        versions: [
          {
            key: 'pets-v2',
            version: '2.0.0',
            title: 'Pets API',
            documentName: 'pets-v2',
            commitHash: undefined,
            registryCommitHash: undefined,
            status: 'synced',
            navigation: undefined,
          },
          {
            key: 'pets-v1',
            version: '1.0.0',
            title: 'Pets API',
            documentName: 'pets-v1',
            commitHash: undefined,
            registryCommitHash: undefined,
            status: 'synced',
            navigation: undefined,
          },
        ],
        activeVersionKey: 'pets-v2',
      },
    ])
  })

  it('merges loaded workspace documents with registry-only versions', () => {
    const { app } = createFakeApp({
      documents: {
        'pets-v1': {
          info: { title: 'Pets v1', version: '1.0.0' },
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'pets',
            version: '1.0.0',
            commitHash: 'abc123',
          },
        },
      },
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [
        {
          namespace: 'acme',
          slug: 'pets',
          title: 'Pets API',
          versions: [
            { version: '2.0.0', commitHash: 'def456' },
            { version: '1.0.0', commitHash: 'abc123' },
          ],
        },
      ],
    })

    // Latest version (2.0.0) is registry-only and ends up first; the loaded
    // 1.0.0 version follows. Each version surfaces both the local hash
    // (only set when the version is loaded) and the registry hash (only set
    // when the registry advertises one) so consumers can detect drift.
    // Matching hashes mean no upstream changes are pending.
    expect(rest.value[0]?.versions).toStrictEqual([
      {
        key: '@acme/pets@2.0.0',
        version: '2.0.0',
        title: 'Pets API',
        documentName: undefined,
        commitHash: undefined,
        registryCommitHash: 'def456',
        status: 'unknown',
        navigation: undefined,
      },
      {
        key: 'pets-v1',
        version: '1.0.0',
        title: 'Pets API',
        documentName: 'pets-v1',
        commitHash: 'abc123',
        registryCommitHash: 'abc123',
        status: 'synced',
        navigation: undefined,
      },
    ])
  })

  it('flags loaded versions whose registry commit hash has moved on as `pull`', () => {
    const { app } = createFakeApp({
      documents: {
        'pets-v1': {
          info: { title: 'Pets v1', version: '1.0.0' },
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'pets',
            version: '1.0.0',
            commitHash: 'old-hash',
          },
        },
      },
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [
        {
          namespace: 'acme',
          slug: 'pets',
          title: 'Pets API',
          versions: [{ version: '1.0.0', commitHash: 'new-hash' }],
        },
      ],
    })

    // The loaded document still pins to `old-hash` while the registry now
    // advertises `new-hash`, which means there are upstream changes the
    // user has not pulled yet. With no cached conflict result, the version
    // surfaces as a plain `pull`.
    expect(rest.value[0]?.versions?.[0]).toStrictEqual({
      key: 'pets-v1',
      version: '1.0.0',
      title: 'Pets API',
      documentName: 'pets-v1',
      commitHash: 'old-hash',
      registryCommitHash: 'new-hash',
      status: 'pull',
      navigation: undefined,
    })
  })

  it('surfaces `conflict` when the registry-meta cache flags a conflict for the current registry hash', () => {
    const { app } = createFakeApp({
      documents: {
        'pets-v1': {
          info: { title: 'Pets v1', version: '1.0.0' },
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'pets',
            version: '1.0.0',
            commitHash: 'old-hash',
            conflictCheckedAgainstHash: 'new-hash',
            hasConflict: true,
          },
        },
      },
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [
        {
          namespace: 'acme',
          slug: 'pets',
          title: 'Pets API',
          versions: [{ version: '1.0.0', commitHash: 'new-hash' }],
        },
      ],
    })

    expect(rest.value[0]?.versions?.[0]?.status).toBe('conflict')
  })

  it('falls back to `pull` when the cached conflict result was computed against a stale registry hash', () => {
    const { app } = createFakeApp({
      documents: {
        'pets-v1': {
          info: { title: 'Pets v1', version: '1.0.0' },
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'pets',
            version: '1.0.0',
            commitHash: 'old-hash',
            // The cache was computed for an older registry hash that has
            // since been replaced; the result is no longer trustworthy.
            conflictCheckedAgainstHash: 'older-hash',
            hasConflict: true,
          },
        },
      },
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [
        {
          namespace: 'acme',
          slug: 'pets',
          title: 'Pets API',
          versions: [{ version: '1.0.0', commitHash: 'new-hash' }],
        },
      ],
    })

    expect(rest.value[0]?.versions?.[0]?.status).toBe('pull')
  })

  it('surfaces `push` when the document is dirty and the hash matches the registry', () => {
    const { app } = createFakeApp({
      documents: {
        'pets-v1': {
          info: { title: 'Pets v1', version: '1.0.0' },
          'x-scalar-is-dirty': true,
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'pets',
            version: '1.0.0',
            commitHash: 'shared-hash',
          },
        },
      },
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [
        {
          namespace: 'acme',
          slug: 'pets',
          title: 'Pets API',
          versions: [{ version: '1.0.0', commitHash: 'shared-hash' }],
        },
      ],
    })

    expect(rest.value[0]?.versions?.[0]?.status).toBe('push')
  })

  it('promotes the active document when it belongs to a group', () => {
    const { app } = createFakeApp({
      documents: {
        'pets-v1': {
          info: { title: 'Pets v1', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets', version: '1.0.0' },
        },
        'pets-v2': {
          info: { title: 'Pets v2', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets', version: '2.0.0' },
        },
      },
      isTeamWorkspace: true,
      documentSlug: 'pets-v1',
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [
        {
          namespace: 'acme',
          slug: 'pets',
          title: 'Pets API',
          versions: [{ version: '2.0.0' }, { version: '1.0.0' }],
        },
      ],
    })

    // Even though 2.0.0 is the latest, the parent surfaces v1 because that
    // is the document the user is currently viewing. The version list
    // ordering itself is not changed — only `activeVersionKey` and the
    // mirrored parent fields move.
    expect(rest.value[0]?.activeVersionKey).toBe('pets-v1')
    expect(rest.value[0]?.documentName).toBe('pets-v1')
    expect(rest.value[0]?.versions?.map((v) => v.version)).toStrictEqual(['2.0.0', '1.0.0'])
  })

  it('emits a versions array even when only a single version exists', () => {
    const { app } = createFakeApp({
      documents: {
        pets: {
          info: { title: 'Pets', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets', version: '1.0.0' },
        },
      },
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [
        {
          namespace: 'acme',
          slug: 'pets',
          title: 'Pets API',
          versions: [{ version: '1.0.0' }],
        },
      ],
    })

    // Registry-backed entries always carry a versions array so the sidebar
    // can render the version row consistently — there is no special-case
    // collapsing to undefined for single-version documents.
    expect(rest.value[0]?.versions).toStrictEqual([
      {
        key: 'pets',
        version: '1.0.0',
        title: 'Pets API',
        documentName: 'pets',
        commitHash: undefined,
        registryCommitHash: undefined,
        status: 'synced',
        navigation: undefined,
      },
    ])
  })

  it('appends registry-only documents that have not been loaded yet', () => {
    const { app } = createFakeApp({
      documents: {},
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [
        {
          namespace: 'acme',
          slug: 'pets',
          title: 'Pets API',
          versions: [
            { version: '2.0.0', commitHash: 'def456' },
            { version: '1.0.0' },
          ],
        },
      ],
    })

    expect(rest.value).toStrictEqual([
      {
        key: '@acme/pets',
        title: 'Pets API',
        documentName: undefined,
        registry: { namespace: 'acme', slug: 'pets' },
        navigation: undefined,
        isPinned: false,
        versions: [
          {
            key: '@acme/pets@2.0.0',
            version: '2.0.0',
            title: 'Pets API',
            documentName: undefined,
            commitHash: undefined,
            registryCommitHash: 'def456',
            status: 'unknown',
            navigation: undefined,
          },
          {
            key: '@acme/pets@1.0.0',
            version: '1.0.0',
            title: 'Pets API',
            documentName: undefined,
            commitHash: undefined,
            registryCommitHash: undefined,
            status: 'unknown',
            navigation: undefined,
          },
        ],
        activeVersionKey: '@acme/pets@2.0.0',
      },
    ])
  })

  it('uses the registry title for parent and version rows even when the loaded document was renamed locally', () => {
    const { app } = createFakeApp({
      documents: {
        pets: {
          info: { title: 'Renamed Locally', version: '1.0.0' },
          'x-scalar-navigation': nav('pets', 'Renamed Locally'),
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets', version: '1.0.0' },
        },
      },
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [
        {
          namespace: 'acme',
          slug: 'pets',
          title: 'Pets API',
          versions: [{ version: '1.0.0' }],
        },
      ],
    })

    // Local renames must not leak into the sidebar — the sidebar mirrors the
    // registry so users can recognise the entry as the same document the
    // registry advertises.
    expect(rest.value[0]?.title).toBe('Pets API')
    expect(rest.value[0]?.versions?.[0]?.title).toBe('Pets API')
  })

  it('falls back to the slug when a registry document has no title', () => {
    const { app } = createFakeApp({
      documents: {},
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [
        {
          namespace: 'acme',
          slug: 'orders',
          title: '',
          versions: [{ version: '1.0.0' }],
        },
      ],
    })

    expect(rest.value[0]?.title).toBe('orders')
    expect(rest.value[0]?.versions?.[0]?.title).toBe('orders')
  })

  it('keeps standalone documents separate from grouped and registry entries', () => {
    const { app } = createFakeApp({
      documents: {
        drafts: { info: { title: 'Drafts', version: '1.0.0' } },
        pets: {
          info: { title: 'Pets', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets', version: '1.0.0' },
        },
      },
      isTeamWorkspace: true,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [
        {
          namespace: 'acme',
          slug: 'pets',
          title: 'Pets API',
          versions: [{ version: '1.0.0' }],
        },
        {
          namespace: 'acme',
          slug: 'orders',
          title: 'Orders',
          versions: [{ version: '1.0.0' }],
        },
      ],
    })

    // grouped (registry order) -> standalone (workspace docs without registry)
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

    registry.value = [
      {
        namespace: 'acme',
        slug: 'pets',
        title: 'Pets API',
        versions: [{ version: '1.0.0' }],
      },
    ]

    expect(rest.value.map((d) => d.key)).toStrictEqual(['@acme/pets'])
    expect(rest.value[0]?.versions).toHaveLength(1)
  })

  it('reacts to toggling the team-workspace flag', () => {
    const { app, teamFlag } = createFakeApp({
      documents: {
        pets: {
          info: { title: 'Pets', version: '1.0.0' },
          'x-scalar-registry-meta': { namespace: 'acme', slug: 'pets', version: '1.0.0' },
        },
      },
      isTeamWorkspace: false,
    })

    const { rest } = useSidebarDocuments({
      app,
      managedDocs: () => [
        {
          namespace: 'acme',
          slug: 'orders',
          title: 'Orders',
          versions: [{ version: '1.0.0' }],
        },
      ],
    })

    // Local: the key comes from the workspace document name (to avoid
    // collisions when multiple local documents share the same registry
    // meta), the `registry` field is undefined, and the registry-only Orders
    // entry is ignored entirely.
    expect(rest.value.map((d) => d.key)).toStrictEqual(['pets'])
    expect(rest.value[0]?.registry).toBeUndefined()
    expect(rest.value[0]?.versions).toBeUndefined()

    teamFlag.value = true

    // Team: the Pets document now exposes its registry coordinates (with a
    // versions array) and the unloaded Orders entry is merged into the list.
    // Registry-advertised entries are emitted first (in registry order) and
    // workspace documents that point at unknown registry coordinates are
    // appended after, so Orders (advertised) precedes Pets (orphan).
    expect(rest.value.map((d) => d.key)).toStrictEqual(['@acme/orders', '@acme/pets'])
    expect(rest.value[1]?.registry).toStrictEqual({
      namespace: 'acme',
      slug: 'pets',
    })
    expect(rest.value[1]?.versions).toHaveLength(1)
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
