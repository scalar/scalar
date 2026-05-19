import { describe, expect, it } from 'vitest'

import {
  FILTER_NAMESPACE_ALL,
  FILTER_NAMESPACE_LOCAL,
  buildNamespaceFilterOptions,
  filterItemsByRegistryNamespace,
  resolveNamespaceFilterTriggerLabel,
  summarizeRegistryNamespaces,
} from '@/features/app/hooks/use-sidebar-documents/helpers/registry-namespace-filter'

type Row = { key: string; registry?: { namespace: string; slug: string } }

describe('registry-namespace-filter', () => {
  it('summarizeRegistryNamespaces returns null for an empty list', () => {
    expect(summarizeRegistryNamespaces([])).toBeNull()
  })

  it('summarizeRegistryNamespaces splits registry rows from workspace-only rows', () => {
    const rows: Row[] = [
      { key: 'a', registry: { namespace: 'acme', slug: 'pets' } },
      { key: 'b', registry: { namespace: 'beta', slug: 'orders' } },
      { key: 'c' },
    ]
    expect(summarizeRegistryNamespaces(rows)).toStrictEqual({
      localCount: 1,
      namespaces: [
        { id: 'acme', label: 'acme', count: 1 },
        { id: 'beta', label: 'beta', count: 1 },
      ],
    })
  })

  it('buildNamespaceFilterOptions includes all, each namespace, and workspace-only', () => {
    const summary = {
      localCount: 1,
      namespaces: [{ id: 'acme', label: 'acme', count: 2 }],
    }
    expect(buildNamespaceFilterOptions(summary, 3)).toStrictEqual([
      { id: FILTER_NAMESPACE_ALL, label: 'All namespaces', count: 3 },
      { id: 'acme', label: 'acme', count: 2 },
      {
        id: FILTER_NAMESPACE_LOCAL,
        label: 'Workspace only',
        description: 'Drafts and docs without a registry link',
        count: 1,
      },
    ])
  })

  it('resolveNamespaceFilterTriggerLabel falls back to All namespaces', () => {
    expect(resolveNamespaceFilterTriggerLabel('missing', [])).toBe('All namespaces')
  })

  it('filterItemsByRegistryNamespace is a no-op when not a team workspace', () => {
    const rows: Row[] = [{ key: 'a', registry: { namespace: 'acme', slug: 'pets' } }]
    expect(filterItemsByRegistryNamespace(rows, 'acme', false)).toStrictEqual(rows)
  })

  it('filterItemsByRegistryNamespace keeps every row for FILTER_NAMESPACE_ALL', () => {
    const rows: Row[] = [{ key: 'a' }, { key: 'b', registry: { namespace: 'acme', slug: 'pets' } }]
    expect(filterItemsByRegistryNamespace(rows, FILTER_NAMESPACE_ALL, true)).toStrictEqual(rows)
  })

  it('filterItemsByRegistryNamespace keeps only rows without registry for local sentinel', () => {
    const rows: Row[] = [{ key: 'a' }, { key: 'b', registry: { namespace: 'acme', slug: 'pets' } }]
    expect(filterItemsByRegistryNamespace(rows, FILTER_NAMESPACE_LOCAL, true)).toStrictEqual([{ key: 'a' }])
  })

  it('filterItemsByRegistryNamespace matches a single namespace id', () => {
    const rows: Row[] = [
      { key: 'a', registry: { namespace: 'acme', slug: 'pets' } },
      { key: 'b', registry: { namespace: 'beta', slug: 'orders' } },
    ]
    expect(filterItemsByRegistryNamespace(rows, 'beta', true)).toStrictEqual([
      { key: 'b', registry: { namespace: 'beta', slug: 'orders' } },
    ])
  })
})
