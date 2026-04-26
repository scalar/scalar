import type { AppState } from '@scalar/api-client/v2/features/app'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { computed, ref, shallowRef } from 'vue'

import { mockEventBus } from '@/v2/helpers/test-utils'

import DocumentSyncIndicator from './DocumentSyncIndicator.vue'

type FakeDocument = Partial<WorkspaceDocument> & {
  'x-scalar-registry-meta'?: {
    namespace: string
    slug: string
    version?: string
    commitHash?: string
    conflictCheckedAgainstHash?: string
    hasConflict?: boolean
  }
  info?: { title?: string; version?: string }
}

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

describe('DocumentSyncIndicator', () => {
  it('renders nothing when there is no active document', () => {
    const { app } = createFakeApp({ documents: {}, activeDocumentName: undefined })
    const wrapper = mount(DocumentSyncIndicator, { props: { app } })

    // No active version → no presentation → component renders nothing.
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('renders nothing when the active document has no registry meta', () => {
    const { app } = createFakeApp({
      documents: { pets: { info: { title: 'Pets API' } } },
      activeDocumentName: 'pets',
    })

    const wrapper = mount(DocumentSyncIndicator, { props: { app } })

    // Local-only documents do not surface a sync status icon.
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('renders the synced icon when local and registry hashes match', () => {
    const { app } = createFakeApp({
      documents: {
        pets: {
          info: { title: 'Pets', version: '1.0.0' },
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'pets',
            version: '1.0.0',
            commitHash: 'shared',
          },
        },
      },
      activeDocumentName: 'pets',
    })

    const wrapper = mount(DocumentSyncIndicator, {
      props: {
        app,
        registryDocuments: {
          status: 'success',
          documents: [
            {
              namespace: 'acme',
              slug: 'pets',
              title: 'Pets API',
              versions: [{ version: '1.0.0', commitHash: 'shared' }],
            },
          ],
        },
      },
    })

    const icon = wrapper.find('svg')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('aria-label')).toBe('Synced with the registry')
  })

  it('renders the pull icon when the registry advertises a newer hash', () => {
    const { app } = createFakeApp({
      documents: {
        pets: {
          info: { title: 'Pets', version: '1.0.0' },
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'pets',
            version: '1.0.0',
            commitHash: 'old',
          },
        },
      },
      activeDocumentName: 'pets',
    })

    const wrapper = mount(DocumentSyncIndicator, {
      props: {
        app,
        registryDocuments: {
          status: 'success',
          documents: [
            {
              namespace: 'acme',
              slug: 'pets',
              title: 'Pets API',
              versions: [{ version: '1.0.0', commitHash: 'new' }],
            },
          ],
        },
      },
    })

    expect(wrapper.find('svg').attributes('aria-label')).toBe('Upstream changes available to pull')
  })

  it('renders the conflict icon when the cached conflict result is current', () => {
    const { app } = createFakeApp({
      documents: {
        pets: {
          info: { title: 'Pets', version: '1.0.0' },
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'pets',
            version: '1.0.0',
            commitHash: 'old',
            conflictCheckedAgainstHash: 'new',
            hasConflict: true,
          },
        },
      },
      activeDocumentName: 'pets',
    })

    const wrapper = mount(DocumentSyncIndicator, {
      props: {
        app,
        registryDocuments: {
          status: 'success',
          documents: [
            {
              namespace: 'acme',
              slug: 'pets',
              title: 'Pets API',
              versions: [{ version: '1.0.0', commitHash: 'new' }],
            },
          ],
        },
      },
    })

    expect(wrapper.find('svg').attributes('aria-label')).toBe(
      'Conflicts detected — resolve before pulling',
    )
  })

  it('mirrors the version that the active document declares, not the latest one', () => {
    const { app } = createFakeApp({
      documents: {
        'pets-v1': {
          info: { title: 'Pets v1', version: '1.0.0' },
          'x-scalar-is-dirty': true,
          'x-scalar-registry-meta': {
            namespace: 'acme',
            slug: 'pets',
            version: '1.0.0',
            commitHash: 'shared',
          },
        },
      },
      activeDocumentName: 'pets-v1',
    })

    const wrapper = mount(DocumentSyncIndicator, {
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
                { version: '2.0.0', commitHash: 'remote-2' },
                { version: '1.0.0', commitHash: 'shared' },
              ],
            },
          ],
        },
      },
    })

    // Active document is v1 with local edits → push, not the v2 status.
    expect(wrapper.find('svg').attributes('aria-label')).toBe('Local changes ready to push')
  })
})
