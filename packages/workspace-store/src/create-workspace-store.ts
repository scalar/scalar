import { reactive, toRaw } from 'vue'
import type { WorkspaceMeta, Workspace, WorkspaceDocumentMeta } from './schemas/server-workspace'
import { isObject } from '@scalar/openapi-parser'
import { createMagicProxy } from './helpers/proxy'
import { resolveRef } from '@/helpers/general'

export function createWorkspaceStore(workspaceProps: {
  meta?: WorkspaceMeta
  documents?: Record<string, Record<string, unknown>>
}) {
  // Reactive store with automatic ref resolution
  // note: only local refs are resolved at access time
  //       for any other refs user have to manually call resolve on them
  // Each of the documents needs a proxy
  // We can't wrap the whole workspace into a proxy because paths are gonna be relative to the actual document
  const workspace = reactive({
    ...workspaceProps.meta,
    documents: Object.fromEntries(
      Object.entries(workspaceProps.documents || {}).map(([key, doc]) => [key, createMagicProxy(doc)]),
    ),
  }) as Workspace

  return {
    get rawWorkspace() {
      return toRaw(workspace)
    },
    get workspace() {
      return {
        ...workspace,
        get activeDocument(): (typeof workspace.documents)[number] | undefined {
          const activeDocumentKey = workspaceProps.meta?.['x-scalar-active-document'] ?? ''
          return workspace.documents[activeDocumentKey]
        },
      }
    },
    // Update workspace metadata
    update<K extends keyof WorkspaceMeta>(key: K, value: WorkspaceMeta[K]) {
      Object.assign(workspace, { [key]: value })
    },
    updateDocument<K extends keyof WorkspaceDocumentMeta>(
      name: 'active' | (string & {}),
      key: K,
      value: WorkspaceDocumentMeta[K],
    ) {
      const currentDocument =
        workspace.documents[name === 'active' ? (workspace['x-scalar-active-document'] ?? '') : name]

      if (!currentDocument) {
        throw 'Please select a valid document'
      }

      Object.assign(currentDocument, { [key]: value })
    },
    /**
     * Manually load a document chunk
     */
    resolve: async (path: string[]) => {
      if (path.length <= 1) {
        throw 'Please provide a valid path'
      }

      const activeDocument =
        workspace.documents[workspace['x-scalar-active-document'] ?? Object.keys(workspace.documents)[0] ?? '']

      let target = activeDocument as Record<string, any>

      for (const p of path) {
        target = target[p]
      }

      if (isObject(target) && '$ref' in target) {
        // Clear all current properties
        Object.keys(target).forEach((key) => {
          delete target[key]
        })

        const ref = target['$ref']

        // Set the status to loading while we resolve the ref
        Object.assign(target, { status: 'loading' })

        const result = await resolveRef(ref)

        if (result.ok) {
          Object.assign(target, result.data)
        } else {
          Object.assign(target, { status: 'error' })
        }
      }
    },

    addDocument: (document: Record<string, unknown>, meta: { name: string } & WorkspaceDocumentMeta) => {
      const { name, ...documentMeta } = meta

      workspace.documents[name] = createMagicProxy({ ...document, ...documentMeta })
    },
  }
}
