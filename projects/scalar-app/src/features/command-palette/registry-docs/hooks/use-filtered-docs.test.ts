import { beforeEach, describe, expect, it, vi } from 'vitest'

const registryDocumentsMock = vi.hoisted(() => ({
  documents: { value: [] as Record<string, unknown>[] },
  useRegistryDocuments: vi.fn(),
}))

vi.mock('@/hooks/use-registry-documents', () => ({
  useRegistryDocuments: registryDocumentsMock.useRegistryDocuments,
}))

import { useFilteredDocs as useFilteredDocsHook } from './use-filtered-docs'

// Helper to create mock ManagedDoc with minimal required fields
const createMockDoc = (
  uid: string,
  namespace: string,
  slug: string,
  versions: Array<{ uid: string; version: string }>,
) => ({
  uid,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  namespace,
  title: slug,
  slug,
  description: '',
  isPrivate: false,
  tags: [],
  accessGroups: [],
  version: versions[0]?.version || '1.0.0',
  isExternal: true,
  agentEnabled: true,
  theme: '',
  editableUid: 'editable',
  ruleset: 'scalar',
  versions: versions.map((v) => ({
    uid: v.uid,
    createdAt: Date.now(),
    version: v.version,
    upgraded: false,
    embedStatus: null,
    tags: [],
  })),
  verified: false,
})

// Mock data
const mockManagedDocs = [
  createMockDoc('doc1', 'acme', 'api-docs', [
    { uid: 'v1', version: '1.0.0' },
    { uid: 'v2', version: '1.1.0' },
    { uid: 'v3', version: '2.0.0' },
  ]),
  createMockDoc('doc2', 'acme', 'other-api', [
    { uid: 'v4', version: '1.0.0' },
    { uid: 'v5', version: '2.0.0' },
  ]),
  createMockDoc('doc3', 'widgets', 'widget-api', [
    { uid: 'v6', version: '1.0.0' },
    { uid: 'v7', version: '1.5.0' },
  ]),
]

beforeEach(() => {
  registryDocumentsMock.documents.value = mockManagedDocs
  registryDocumentsMock.useRegistryDocuments.mockReturnValue({
    documents: registryDocumentsMock.documents,
  })
})

const useFilteredDocs = (
  managedDocs,
  initialValue = '',
): ReturnType<typeof useFilteredDocsHook> => {
  registryDocumentsMock.documents.value = managedDocs

  return useFilteredDocsHook(initialValue)
}

describe('completionOptions - empty or no @ prefix', () => {
  it('should show all docs when query is empty', () => {
    const { completionOptions } = useFilteredDocs(mockManagedDocs, '')

    expect(completionOptions.value).toEqual([
      '@acme/api-docs',
      '@acme/other-api',
      '@widgets/widget-api',
    ])
  })

  it('should filter docs by slug when query has no @ prefix', () => {
    const { completionOptions } = useFilteredDocs(mockManagedDocs, 'api')

    expect(completionOptions.value).toEqual([
      '@acme/api-docs',
      '@acme/other-api',
      '@widgets/widget-api',
    ])
  })

  it('should filter to matching slugs when query has partial match', () => {
    const { completionOptions } = useFilteredDocs(mockManagedDocs, 'widget')

    expect(completionOptions.value).toEqual(['@widgets/widget-api'])
  })
})

describe('completionOptions - selecting namespace', () => {
  it('should show all namespaces when query starts with @', () => {
    const { completionOptions } = useFilteredDocs(mockManagedDocs, '@')

    expect(completionOptions.value).toEqual(['@acme', '@widgets'])
  })

  it('should show all namespaces when query has partial namespace', () => {
    const { completionOptions } = useFilteredDocs(mockManagedDocs, '@acm')

    expect(completionOptions.value).toEqual(['@acme', '@widgets'])
  })
})

describe('completionOptions - selecting document', () => {
  it('should show docs for selected namespace with / separator', () => {
    const { completionOptions } = useFilteredDocs(mockManagedDocs, '@acme/')

    expect(completionOptions.value).toEqual(['api-docs', 'other-api'])
  })

  it('should show docs for widgets namespace', () => {
    const { completionOptions } = useFilteredDocs(mockManagedDocs, '@widgets/')

    expect(completionOptions.value).toEqual(['widget-api'])
  })

  it('should show docs even with partial doc slug', () => {
    const { completionOptions } = useFilteredDocs(mockManagedDocs, '@acme/api')

    expect(completionOptions.value).toEqual(['api-docs', 'other-api'])
  })
})

describe('completionOptions - selecting version with / separator', () => {
  it('should show versions for selected doc', () => {
    const { completionOptions } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs/',
    )

    expect(completionOptions.value).toEqual(['1.0.0', '1.1.0', '2.0.0'])
  })

  it('should show versions for other-api', () => {
    const { completionOptions } = useFilteredDocs(
      mockManagedDocs,
      '@acme/other-api/',
    )

    expect(completionOptions.value).toEqual(['1.0.0', '2.0.0'])
  })

  it('should show versions even with partial version', () => {
    const { completionOptions } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs/1',
    )

    expect(completionOptions.value).toEqual(['1.0.0', '1.1.0', '2.0.0'])
  })
})

describe('completionOptions - selecting version with @ separator', () => {
  it('should show versions for selected doc with @ separator', () => {
    const { completionOptions } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs@',
    )

    expect(completionOptions.value).toEqual(['1.0.0', '1.1.0', '2.0.0'])
  })

  it('should show versions even with partial version after @', () => {
    const { completionOptions } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs@1',
    )

    expect(completionOptions.value).toEqual(['1.0.0', '1.1.0', '2.0.0'])
  })

  it('should handle @ separator for widgets namespace', () => {
    const { completionOptions } = useFilteredDocs(
      mockManagedDocs,
      '@widgets/widget-api@',
    )

    expect(completionOptions.value).toEqual(['1.0.0', '1.5.0'])
  })
})

describe('completionOptions - complete query', () => {
  it('should return empty array when complete match with / separator', () => {
    const { completionOptions } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs/1.0.0',
    )

    expect(completionOptions.value).toEqual([])
  })

  it('should return empty array when complete match with @ separator', () => {
    const { completionOptions } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs@1.0.0',
    )

    expect(completionOptions.value).toEqual([])
  })
})

describe('completionOptions - deduplication', () => {
  it('should return unique namespaces', () => {
    const { completionOptions } = useFilteredDocs(mockManagedDocs, '@')

    // acme appears twice in mock data but should only show once
    expect(completionOptions.value).toEqual(['@acme', '@widgets'])
    expect(completionOptions.value.length).toBe(2)
  })
})

describe('handleSelect - selecting namespace', () => {
  it('should ignore null selections', () => {
    const { query, handleSelect } = useFilteredDocs(mockManagedDocs, '')

    handleSelect(null)

    expect(query.value).toBe('')
  })

  it('should append / after namespace selection', () => {
    const { query, handleSelect } = useFilteredDocs(mockManagedDocs, '@acm')

    handleSelect('@acme')

    expect(query.value).toBe('@acme/')
  })

  it('should handle complete namespace selection', () => {
    const { query, handleSelect } = useFilteredDocs(mockManagedDocs, '@')

    handleSelect('@widgets')

    expect(query.value).toBe('@widgets/')
  })
})

describe('handleSelect - selecting from all docs view', () => {
  it('should append / after doc selection from no @ prefix', () => {
    const { query, handleSelect } = useFilteredDocs(mockManagedDocs, 'api')

    handleSelect('@acme/api-docs')

    expect(query.value).toBe('@acme/api-docs/')
  })

  it('should handle empty query doc selection', () => {
    const { query, handleSelect } = useFilteredDocs(mockManagedDocs, '')

    handleSelect('@widgets/widget-api')

    expect(query.value).toBe('@widgets/widget-api/')
  })
})

describe('handleSelect - selecting document', () => {
  it('should append @ after doc selection with / separator', () => {
    const { query, handleSelect } = useFilteredDocs(mockManagedDocs, '@acme/')

    handleSelect('api-docs')

    expect(query.value).toBe('@acme/api-docs@')
  })

  it('should use @ separator for version after doc selection', () => {
    const { query, handleSelect } = useFilteredDocs(
      mockManagedDocs,
      '@widgets/',
    )

    handleSelect('widget-api')

    expect(query.value).toBe('@widgets/widget-api@')
  })
})

describe('handleSelect - selecting version with / separator', () => {
  it('should complete the query with @ separator', () => {
    const { query, handleSelect } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs/',
    )

    handleSelect('1.0.0')

    expect(query.value).toBe('@acme/api-docs@1.0.0')
  })

  it('should handle version selection with partial version in query', () => {
    const { query, handleSelect } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs/1',
    )

    handleSelect('1.1.0')

    expect(query.value).toBe('@acme/api-docs@1.1.0')
  })
})

describe('handleSelect - selecting version with @ separator', () => {
  it('should complete the query maintaining @ separator', () => {
    const { query, handleSelect } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs@',
    )

    handleSelect('2.0.0')

    expect(query.value).toBe('@acme/api-docs@2.0.0')
  })

  it('should handle version selection with partial version after @', () => {
    const { query, handleSelect } = useFilteredDocs(
      mockManagedDocs,
      '@widgets/widget-api@1',
    )

    handleSelect('1.5.0')

    expect(query.value).toBe('@widgets/widget-api@1.5.0')
  })
})

describe('reactivity', () => {
  it('should update completionOptions when query changes', () => {
    const { query, completionOptions } = useFilteredDocs(mockManagedDocs, '@')

    expect(completionOptions.value).toEqual(['@acme', '@widgets'])

    query.value = '@acme/'
    expect(completionOptions.value).toEqual(['api-docs', 'other-api'])

    query.value = '@acme/api-docs@'
    expect(completionOptions.value).toEqual(['1.0.0', '1.1.0', '2.0.0'])
  })

  it('should update when query is modified by handleSelect', () => {
    const { query, completionOptions, handleSelect } = useFilteredDocs(
      mockManagedDocs,
      '@acme/',
    )

    expect(completionOptions.value).toEqual(['api-docs', 'other-api'])

    handleSelect('api-docs')

    expect(query.value).toBe('@acme/api-docs@')
    expect(completionOptions.value).toEqual(['1.0.0', '1.1.0', '2.0.0'])
  })
})

describe('edge cases', () => {
  it('should handle empty managedDocs array', () => {
    const { completionOptions } = useFilteredDocs([], '@')

    expect(completionOptions.value).toEqual([])
  })

  it('should handle docs with no versions', () => {
    const docsWithNoVersions = [createMockDoc('doc1', 'test', 'test-api', [])]

    const { completionOptions } = useFilteredDocs(
      docsWithNoVersions,
      '@test/test-api@',
    )

    expect(completionOptions.value).toEqual([])
  })

  it('should handle namespace with special characters', () => {
    const { completionOptions } = useFilteredDocs(mockManagedDocs, '@')

    // All namespaces should be prefixed with @
    expect(completionOptions.value.every((opt) => opt.startsWith('@'))).toBe(
      true,
    )
  })

  it('should handle version with dots and numbers', () => {
    const { completionOptions } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs@',
    )

    expect(completionOptions.value).toContain('1.0.0')
    expect(completionOptions.value).toContain('1.1.0')
    expect(completionOptions.value).toContain('2.0.0')
  })

  it('should not show options after complete query with /', () => {
    const { completionOptions } = useFilteredDocs(
      mockManagedDocs,
      '@acme/other-api/2.0.0',
    )

    expect(completionOptions.value).toEqual([])
  })

  it('should not show options after complete query with @', () => {
    const { completionOptions } = useFilteredDocs(
      mockManagedDocs,
      '@widgets/widget-api@1.5.0',
    )

    expect(completionOptions.value).toEqual([])
  })

  it('should handle multiple slashes gracefully', () => {
    const { completionOptions } = useFilteredDocs(mockManagedDocs, '@acme//')

    // With empty doc slug, it's treated as complete query
    expect(completionOptions.value).toEqual([])
  })
})

describe('format compatibility', () => {
  it('should parse both / and @ version separators in query', () => {
    const { completionOptions: optionsSlash } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs/1.0.0',
    )

    const { completionOptions: optionsAt } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs@1.0.0',
    )

    // Both formats should result in empty completion (complete query)
    expect(optionsSlash.value).toEqual([])
    expect(optionsAt.value).toEqual([])
  })

  it('should handle transition from / to @ in same query', () => {
    const { query, completionOptions } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs/',
    )

    expect(completionOptions.value).toEqual(['1.0.0', '1.1.0', '2.0.0'])

    // Change to @ separator
    query.value = '@acme/api-docs@'
    expect(completionOptions.value).toEqual(['1.0.0', '1.1.0', '2.0.0'])
  })
})

describe('selectedDocument', () => {
  it('should return null when namespace is not set', () => {
    const { selectedDocument } = useFilteredDocs(mockManagedDocs, '')

    expect(selectedDocument.value).toBeNull()
  })

  it('should return null when only namespace is set', () => {
    const { selectedDocument } = useFilteredDocs(mockManagedDocs, '@acme')

    expect(selectedDocument.value).toBeNull()
  })

  it('should return null when docSlug is not set', () => {
    const { selectedDocument } = useFilteredDocs(mockManagedDocs, '@acme/')

    expect(selectedDocument.value).toBeNull()
  })

  it('should return document with first version when namespace and slug match but no version specified', () => {
    const { selectedDocument } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs',
    )

    expect(selectedDocument.value).not.toBeNull()
    expect(selectedDocument.value?.namespace).toBe('acme')
    expect(selectedDocument.value?.slug).toBe('api-docs')
    expect(selectedDocument.value?.version).toBe('1.0.0')
    expect(selectedDocument.value?.documentUid).toBe('doc1')
    expect(selectedDocument.value?.versionUid).toBe('v1')
  })

  it('should return document with first version when ending with /', () => {
    const { selectedDocument } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs/',
    )

    expect(selectedDocument.value).not.toBeNull()
    expect(selectedDocument.value?.namespace).toBe('acme')
    expect(selectedDocument.value?.slug).toBe('api-docs')
    expect(selectedDocument.value?.version).toBe('1.0.0')
  })

  it('should return document with first version when ending with @', () => {
    const { selectedDocument } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs@',
    )

    expect(selectedDocument.value).not.toBeNull()
    expect(selectedDocument.value?.namespace).toBe('acme')
    expect(selectedDocument.value?.slug).toBe('api-docs')
    expect(selectedDocument.value?.version).toBe('1.0.0')
  })

  it('should return document with exact version match using / separator', () => {
    const { selectedDocument } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs/1.1.0',
    )

    expect(selectedDocument.value).not.toBeNull()
    expect(selectedDocument.value?.namespace).toBe('acme')
    expect(selectedDocument.value?.slug).toBe('api-docs')
    expect(selectedDocument.value?.version).toBe('1.1.0')
    expect(selectedDocument.value?.versionUid).toBe('v2')
  })

  it('should return document with exact version match using @ separator', () => {
    const { selectedDocument } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs@2.0.0',
    )

    expect(selectedDocument.value).not.toBeNull()
    expect(selectedDocument.value?.namespace).toBe('acme')
    expect(selectedDocument.value?.slug).toBe('api-docs')
    expect(selectedDocument.value?.version).toBe('2.0.0')
    expect(selectedDocument.value?.versionUid).toBe('v3')
  })

  it('should return null when version does not exist', () => {
    const { selectedDocument } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs@99.99.99',
    )

    expect(selectedDocument.value).toBeNull()
  })

  it('should return null when partial version is typed but does not match', () => {
    const { selectedDocument } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs@9',
    )

    expect(selectedDocument.value).toBeNull()
  })

  it('should return null when namespace does not exist', () => {
    const { selectedDocument } = useFilteredDocs(
      mockManagedDocs,
      '@nonexistent/api-docs',
    )

    expect(selectedDocument.value).toBeNull()
  })

  it('should return null when slug does not exist', () => {
    const { selectedDocument } = useFilteredDocs(
      mockManagedDocs,
      '@acme/nonexistent',
    )

    expect(selectedDocument.value).toBeNull()
  })

  it('should work with widgets namespace', () => {
    const { selectedDocument } = useFilteredDocs(
      mockManagedDocs,
      '@widgets/widget-api@1.5.0',
    )

    expect(selectedDocument.value).not.toBeNull()
    expect(selectedDocument.value?.namespace).toBe('widgets')
    expect(selectedDocument.value?.slug).toBe('widget-api')
    expect(selectedDocument.value?.version).toBe('1.5.0')
  })

  it('should reactively update when query changes', () => {
    const { query, selectedDocument } = useFilteredDocs(
      mockManagedDocs,
      '@acme/api-docs',
    )

    expect(selectedDocument.value?.version).toBe('1.0.0')

    query.value = '@acme/api-docs@2.0.0'
    expect(selectedDocument.value?.version).toBe('2.0.0')
  })

  it('should handle docs with no versions', () => {
    const docsWithNoVersions = [createMockDoc('doc1', 'test', 'test-api', [])]

    const { selectedDocument } = useFilteredDocs(
      docsWithNoVersions,
      '@test/test-api',
    )

    expect(selectedDocument.value).toBeNull()
  })

  it('should return the correct document and version UIDs', () => {
    const { selectedDocument } = useFilteredDocs(
      mockManagedDocs,
      '@acme/other-api@2.0.0',
    )

    expect(selectedDocument.value).not.toBeNull()
    expect(selectedDocument.value?.documentUid).toBe('doc2')
    expect(selectedDocument.value?.versionUid).toBe('v5')
    expect(selectedDocument.value?.namespace).toBe('acme')
    expect(selectedDocument.value?.slug).toBe('other-api')
    expect(selectedDocument.value?.version).toBe('2.0.0')
  })
})
