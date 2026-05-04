import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import type { TraversedDocument } from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'
import { computed, ref, shallowRef } from 'vue'

import type { AppState } from '@/v2/features/app'
import type { RegistryDocument } from '@/v2/types/configuration'

import { useCommandPaletteDocuments } from './use-command-palette-documents'

type FakeDocument = Partial<WorkspaceDocument> & {
  'x-scalar-registry-meta'?: {
    namespace: string
    slug: string
    version?: string
    commitHash?: string
  }
  'x-scalar-navigation'?: TraversedDocument
  info?: { title?: string; version?: string }
}

/**
 * Builds the slice of `AppState` the hook actually reads. We avoid
 * spinning up the full app machinery so each test stays focused on the
 * grouping behaviour the command palette cares about.
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

  return { app, slug }
}

const nav = (name: string, title: string): TraversedDocument =>
  ({
    id: name,
    type: 'document',
    name,
    title,
    children: [],
  }) as unknown as TraversedDocument

describe('useCommandPaletteDocuments', () => {
  it('lists every workspace document in a local workspace', () => {
    const { app } = createFakeApp({
      documents: {
        local: {
          info: { title: 'Local API', version: '1.0.0' },
          'x-scalar-navigation': nav('local', 'Local API'),
        },
        drafts: {
          info: { title: 'Drafts', version: '1.0.0' },
          'x-scalar-navigation': nav('drafts', 'Drafts'),
        },
      },
    })

    const documents = useCommandPaletteDocuments({ app, managedDocs: () => [] })

    expect(documents.value).toEqual([
      { id: 'local', label: 'Local API' },
      { id: 'drafts', label: 'Drafts' },
    ])
  })

  it('collapses registry-backed versions into a single option that exposes every loaded version', () => {
    const registry: RegistryDocument = {
      namespace: 'acme',
      slug: 'api',
      title: 'Acme API',
      versions: [
        { version: '1.0.0', commitHash: 'a' },
        { version: '0.9.0', commitHash: 'b' },
      ],
    }

    const { app } = createFakeApp({
      isTeamWorkspace: true,
      documentSlug: 'acme-api-v1',
      documents: {
        'acme-api-v1': {
          info: { title: 'Ignored Local Title', version: '1.0.0' },
          'x-scalar-navigation': nav('acme-api-v1', 'Acme API'),
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'api',
            version: '1.0.0',
            commitHash: 'a',
          },
        },
        'acme-api-v0': {
          info: { title: 'Acme API', version: '0.9.0' },
          'x-scalar-navigation': nav('acme-api-v0', 'Acme API'),
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'api',
            version: '0.9.0',
            commitHash: 'b',
          },
        },
      },
    })

    const documents = useCommandPaletteDocuments({
      app,
      managedDocs: () => [registry],
    })

    expect(documents.value).toEqual([
      {
        id: 'acme-api-v1',
        label: 'Acme API',
        versions: [
          { id: 'acme-api-v1', label: '1.0.0' },
          { id: 'acme-api-v0', label: '0.9.0' },
        ],
      },
    ])
  })

  it('omits the versions field when only one version of a registry-backed document is loaded', () => {
    const registry: RegistryDocument = {
      namespace: 'acme',
      slug: 'api',
      title: 'Acme API',
      versions: [
        { version: '1.0.0', commitHash: 'a' },
        { version: '0.9.0', commitHash: 'b' },
      ],
    }

    const { app } = createFakeApp({
      isTeamWorkspace: true,
      documentSlug: 'acme-api-v1',
      documents: {
        'acme-api-v1': {
          info: { title: 'Acme API', version: '1.0.0' },
          'x-scalar-navigation': nav('acme-api-v1', 'Acme API'),
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'api',
            version: '1.0.0',
            commitHash: 'a',
          },
        },
      },
    })

    const documents = useCommandPaletteDocuments({
      app,
      managedDocs: () => [registry],
    })

    expect(documents.value).toEqual([{ id: 'acme-api-v1', label: 'Acme API' }])
  })

  it('targets the active registry version when the user has drilled into one', () => {
    const registry: RegistryDocument = {
      namespace: 'acme',
      slug: 'api',
      title: 'Acme API',
      versions: [
        { version: '1.0.0', commitHash: 'a' },
        { version: '0.9.0', commitHash: 'b' },
      ],
    }

    const { app } = createFakeApp({
      isTeamWorkspace: true,
      documentSlug: 'acme-api-v0',
      documents: {
        'acme-api-v1': {
          info: { title: 'Acme API', version: '1.0.0' },
          'x-scalar-navigation': nav('acme-api-v1', 'Acme API'),
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'api',
            version: '1.0.0',
          },
        },
        'acme-api-v0': {
          info: { title: 'Acme API', version: '0.9.0' },
          'x-scalar-navigation': nav('acme-api-v0', 'Acme API'),
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'api',
            version: '0.9.0',
          },
        },
      },
    })

    const documents = useCommandPaletteDocuments({
      app,
      managedDocs: () => [registry],
    })

    expect(documents.value).toEqual([
      {
        id: 'acme-api-v0',
        label: 'Acme API',
        versions: [
          { id: 'acme-api-v1', label: '1.0.0' },
          { id: 'acme-api-v0', label: '0.9.0' },
        ],
      },
    ])
  })

  it('skips registry-advertised versions that are not loaded into the workspace store', () => {
    const registry: RegistryDocument = {
      namespace: 'acme',
      slug: 'api',
      title: 'Acme API',
      versions: [
        { version: '2.0.0', commitHash: 'c' },
        { version: '1.0.0', commitHash: 'a' },
        { version: '0.9.0', commitHash: 'b' },
      ],
    }

    const { app } = createFakeApp({
      isTeamWorkspace: true,
      documentSlug: 'acme-api-v1',
      documents: {
        'acme-api-v1': {
          info: { title: 'Acme API', version: '1.0.0' },
          'x-scalar-navigation': nav('acme-api-v1', 'Acme API'),
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'api',
            version: '1.0.0',
            commitHash: 'a',
          },
        },
        'acme-api-v0': {
          info: { title: 'Acme API', version: '0.9.0' },
          'x-scalar-navigation': nav('acme-api-v0', 'Acme API'),
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'api',
            version: '0.9.0',
            commitHash: 'b',
          },
        },
      },
    })

    const documents = useCommandPaletteDocuments({
      app,
      managedDocs: () => [registry],
    })

    expect(documents.value[0]?.versions).toEqual([
      { id: 'acme-api-v1', label: '1.0.0' },
      { id: 'acme-api-v0', label: '0.9.0' },
    ])
  })

  it('omits registry entries that do not have a loaded version', () => {
    const registry: RegistryDocument = {
      namespace: 'acme',
      slug: 'api',
      title: 'Acme API',
      versions: [{ version: '1.0.0' }],
    }

    const { app } = createFakeApp({
      isTeamWorkspace: true,
      documents: {},
    })

    const documents = useCommandPaletteDocuments({
      app,
      managedDocs: () => [registry],
    })

    expect(documents.value).toEqual([])
  })
})
