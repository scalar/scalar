import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { createNavigation } from '@scalar/workspace-store/navigation'
import type { OpenApiDocument, TraversedEntry } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { vi } from 'vitest'
import { computed, ref } from 'vue'

/**
 * A collection of tools which are used strictly for testing
 */

export const createMockSidebar = (collapsedItems: Record<string, boolean> = {}, entries: TraversedEntry[] = []) => ({
  collapsedSidebarItems: collapsedItems,
  isSidebarOpen: ref(true),
  items: computed(() => ({ entries, titles: new Map() })),
  scrollToOperation: vi.fn(),
  setCollapsedSidebarItem: vi.fn(),
  toggleCollapsedSidebarItem: vi.fn(),
})

export const createMockSidebarFromDocument = (document: OpenAPIV3_1.Document) => {
  const result = createNavigation(document as OpenApiDocument, {})
  return createMockSidebar({}, result.entries)
}

export const createMockPluginManager = () => ({
  getSpecificationExtensions: vi.fn(),
})

export const createMockNavState = (hash = '') => ({
  hash: ref(hash),
  hashPrefix: ref(''),
  isIntersectionEnabled: ref(true),
  setHashPrefix: vi.fn(),
  getFullHash: vi.fn(),
  getHashedUrl: vi.fn(),
  replaceUrlState: vi.fn(),
  getReferenceId: vi.fn(),
  getWebhookId: vi.fn(),
  getModelId: vi.fn(),
  getHeadingId: vi.fn(),
  getOperationId: vi.fn(),
  getPathRoutingId: vi.fn(),
  getSectionId: vi.fn(),
  getTagId: vi.fn(),
  updateHash: vi.fn(),
})

export const createMockStore = (activeDocument: WorkspaceDocument): WorkspaceStore => ({
  workspace: {
    documents: {},
    activeDocument,
  },
  update: vi.fn(),
  updateDocument: vi.fn(),
  resolve: vi.fn(),
  addDocument: vi.fn(),
  config: {
    'x-scalar-reference-config': {} as any,
  },
  exportDocument: vi.fn(),
  exportActiveDocument: vi.fn(),
  saveDocument: vi.fn(),
  revertDocumentChanges: vi.fn(),
  commitDocument: vi.fn(),
  exportWorkspace: vi.fn(),
  loadWorkspace: vi.fn(),
  importWorkspaceFromSpecification: vi.fn(),
  replaceDocument: vi.fn(),
  rebaseDocument: vi.fn(),
})

export const createMockLocalStorage = () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
})
