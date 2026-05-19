import { describe, expect, it } from 'vitest'

import { buildRegistryItem, registryKey } from '@/features/app/hooks/use-sidebar-documents/helpers/build-registry-item'
import type { WorkspaceDocumentEntry } from '@/features/app/hooks/use-sidebar-documents/types'
import type { RegistryDocument } from '@/types/configuration'

const workspaceEntry = (
  overrides: Partial<WorkspaceDocumentEntry> & Pick<WorkspaceDocumentEntry, 'documentName' | 'title'>,
): WorkspaceDocumentEntry => ({
  isPinned: false,
  ...overrides,
})

const registryDocument = (
  overrides: Partial<RegistryDocument> & Pick<RegistryDocument, 'namespace' | 'slug' | 'versions'>,
): RegistryDocument => ({
  title: 'Registry title',
  ...overrides,
})

describe('build-registry-item', () => {
  describe('registryKey', () => {
    it('prefixes namespace and slug with an at-sign path segment', () => {
      expect(registryKey('acme', 'pets')).toBe('@acme/pets')
    })
  })

  describe('buildRegistryItem', () => {
    it('returns undefined when there are no versions and nothing loaded', () => {
      const result = buildRegistryItem({
        key: '@acme/pets',
        registry: registryDocument({
          namespace: 'acme',
          slug: 'pets',
          title: 'Pets',
          versions: [],
        }),
        loaded: [],
        activeDocumentSlug: undefined,
      })

      expect(result).toBeUndefined()
    })

    it('uses the slug as the group title when the registry title is empty', () => {
      const result = buildRegistryItem({
        key: '@acme/pets',
        registry: registryDocument({
          namespace: 'acme',
          slug: 'pets',
          title: '',
          versions: [{ version: '1.0.0' }],
        }),
        loaded: [],
        activeDocumentSlug: undefined,
      })

      expect(result?.title).toBe('pets')
      expect(result?.versions?.every((v) => v.title === 'pets')).toBe(true)
    })

    it('marks only the first registry-advertised row as latest', () => {
      const result = buildRegistryItem({
        key: '@acme/pets',
        registry: registryDocument({
          namespace: 'acme',
          slug: 'pets',
          versions: [{ version: '2.0.0' }, { version: '1.0.0' }],
        }),
        loaded: [],
        activeDocumentSlug: undefined,
      })

      expect(result?.versions?.map((v) => ({ version: v.version, isLatest: v.isLatest }))).toStrictEqual([
        { version: '2.0.0', isLatest: true },
        { version: '1.0.0', isLatest: false },
      ])
    })

    it('uses a synthetic key for unloaded registry versions', () => {
      const result = buildRegistryItem({
        key: '@acme/pets',
        registry: registryDocument({
          namespace: 'acme',
          slug: 'pets',
          versions: [{ version: '1.0.0', commitHash: 'reg' }],
        }),
        loaded: [],
        activeDocumentSlug: undefined,
      })

      expect(result?.versions?.[0]).toMatchObject({
        key: '@acme/pets@1.0.0',
        version: '1.0.0',
        documentName: undefined,
        status: 'unknown',
        registryCommitHash: 'reg',
      })
    })

    it('merges a loaded workspace row into the matching registry version', () => {
      const result = buildRegistryItem({
        key: '@acme/pets',
        registry: registryDocument({
          namespace: 'acme',
          slug: 'pets',
          versions: [{ version: '1.0.0', commitHash: 'abc' }],
        }),
        loaded: [
          workspaceEntry({
            documentName: 'pets-local',
            title: 'Renamed locally',
            registry: {
              namespace: 'acme',
              slug: 'pets',
              version: '1.0.0',
              commitHash: 'abc',
            },
          }),
        ],
        activeDocumentSlug: undefined,
      })

      expect(result?.title).toBe('Registry title')
      expect(result?.versions?.[0]).toMatchObject({
        key: 'pets-local',
        documentName: 'pets-local',
        commitHash: 'abc',
        registryCommitHash: 'abc',
        status: 'synced',
      })
      expect(result?.documentName).toBe('pets-local')
      expect(result?.activeVersionKey).toBe('pets-local')
    })

    it('prefers the loaded version whose document name matches the active slug', () => {
      const result = buildRegistryItem({
        key: '@acme/pets',
        registry: registryDocument({
          namespace: 'acme',
          slug: 'pets',
          versions: [{ version: '2.0.0' }, { version: '1.0.0' }],
        }),
        loaded: [
          workspaceEntry({
            documentName: 'pets-v2',
            title: 'v2',
            registry: { namespace: 'acme', slug: 'pets', version: '2.0.0' },
          }),
          workspaceEntry({
            documentName: 'pets-v1',
            title: 'v1',
            registry: { namespace: 'acme', slug: 'pets', version: '1.0.0' },
          }),
        ],
        activeDocumentSlug: 'pets-v1',
      })

      expect(result?.documentName).toBe('pets-v1')
      expect(result?.activeVersionKey).toBe('pets-v1')
    })

    it('places drafts ahead of registry rows with the most recently added draft first', () => {
      const result = buildRegistryItem({
        key: '@acme/pets',
        registry: registryDocument({
          namespace: 'acme',
          slug: 'pets',
          versions: [{ version: '1.0.0' }],
        }),
        loaded: [
          workspaceEntry({
            documentName: 'draft-old',
            title: 'old',
            registry: { namespace: 'acme', slug: 'pets', version: '2.0.0' },
          }),
          workspaceEntry({
            documentName: 'draft-new',
            title: 'new',
            registry: { namespace: 'acme', slug: 'pets', version: '3.0.0' },
          }),
        ],
        activeDocumentSlug: undefined,
      })

      expect(result?.versions?.map((v) => v.version)).toStrictEqual(['3.0.0', '2.0.0', '1.0.0'])
      expect(result?.versions?.filter((v) => v.isLatest)).toStrictEqual([
        expect.objectContaining({ version: '1.0.0', isLatest: true }),
      ])
    })

    it('treats a second workspace document claiming the same version as an orphan tail row', () => {
      const result = buildRegistryItem({
        key: '@acme/pets',
        registry: registryDocument({
          namespace: 'acme',
          slug: 'pets',
          versions: [{ version: '1.0.0' }],
        }),
        loaded: [
          workspaceEntry({
            documentName: 'pets-primary',
            title: 'primary',
            registry: { namespace: 'acme', slug: 'pets', version: '1.0.0', commitHash: 'a' },
          }),
          workspaceEntry({
            documentName: 'pets-duplicate',
            title: 'duplicate',
            registry: { namespace: 'acme', slug: 'pets', version: '1.0.0', commitHash: 'b' },
          }),
        ],
        activeDocumentSlug: undefined,
      })

      expect(result?.versions?.map((v) => v.key)).toStrictEqual(['pets-primary', 'pets-duplicate'])
      expect(result?.versions?.[0]?.documentName).toBe('pets-primary')
      expect(result?.versions?.[1]).toMatchObject({
        key: 'pets-duplicate',
        documentName: 'pets-duplicate',
        isLatest: false,
      })
    })

    it('appends entries that have registry meta but no declared version after registry rows', () => {
      const result = buildRegistryItem({
        key: '@acme/pets',
        registry: registryDocument({
          namespace: 'acme',
          slug: 'pets',
          versions: [{ version: '1.0.0' }],
        }),
        loaded: [
          workspaceEntry({
            documentName: 'pets-v1',
            title: 'v1',
            registry: { namespace: 'acme', slug: 'pets', version: '1.0.0' },
          }),
          workspaceEntry({
            documentName: 'no-version',
            title: 'orphan',
            registry: { namespace: 'acme', slug: 'pets' },
          }),
        ],
        activeDocumentSlug: undefined,
      })

      const tail = result?.versions?.at(-1)
      expect(tail).toMatchObject({
        key: 'no-version',
        documentName: 'no-version',
        version: '',
        isLatest: false,
      })
    })

    it('sets isPinned when any loaded workspace entry is pinned', () => {
      const result = buildRegistryItem({
        key: '@acme/pets',
        registry: registryDocument({
          namespace: 'acme',
          slug: 'pets',
          versions: [{ version: '1.0.0' }],
        }),
        loaded: [
          workspaceEntry({
            documentName: 'pets-v1',
            title: 'v1',
            isPinned: true,
            registry: { namespace: 'acme', slug: 'pets', version: '1.0.0' },
          }),
        ],
        activeDocumentSlug: undefined,
      })

      expect(result?.isPinned).toBe(true)
    })

    it('surfaces conflict when cached conflict metadata matches the registry hash', () => {
      const result = buildRegistryItem({
        key: '@acme/pets',
        registry: registryDocument({
          namespace: 'acme',
          slug: 'pets',
          versions: [{ version: '1.0.0', commitHash: 'remote' }],
        }),
        loaded: [
          workspaceEntry({
            documentName: 'pets-v1',
            title: 'v1',
            registry: {
              namespace: 'acme',
              slug: 'pets',
              version: '1.0.0',
              commitHash: 'local',
              conflictCheckedAgainstHash: 'remote',
              hasConflict: true,
            },
          }),
        ],
        activeDocumentSlug: undefined,
      })

      expect(result?.versions?.[0]?.status).toBe('conflict')
    })
  })
})
