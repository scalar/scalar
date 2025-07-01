import type { WorkspaceStore } from '@/client'
import { cookieMutators } from '@/mutators/cookie'
import { environmentMutators } from '@/mutators/environment'
import { getDocument } from '@/mutators/helpers'
import { requestMutators } from '@/mutators/request'
import { requestExampleMutators } from '@/mutators/request-example'
import { securitySchemeMutators } from '@/mutators/security-schemes'

/**
 * Generates a set of mutators for managing OpenAPI document and workspace state.
 *
 * @param store - The workspace store containing all documents and workspace-level data
 * @returns An object with mutators for the workspace, the active document, and any named document
 */
export function generateClientMutators(store: WorkspaceStore) {
  /**
   * Returns mutators for a specific document by name.
   *
   * @param documentName - The name of the document to get mutators for
   * @returns An object containing mutators for requests, request examples, security schemes, environments, and cookies
   */
  const documentMutators = (documentName: string) => {
    return {
      requestExampleMutators: requestExampleMutators(store, documentName),
      requestMutators: requestMutators(store, documentName),
      securitySchemeMutators: securitySchemeMutators(store, documentName),
      environmentMutators: environmentMutators(getDocument(store, documentName)),
      cookieMutators: cookieMutators(getDocument(store, documentName)),
    }
  }

  /**
   * Returns mutators for the workspace-level configuration.
   *
   * @returns An object containing mutators for environments and cookies at the workspace level
   */
  const workspaceMutators = () => {
    return {
      environmentMutators: environmentMutators(store.workspace),
      cookieMutators: cookieMutators(store.workspace),
    }
  }

  return {
    /**
     * Returns mutators for the workspace-level configuration.
     */
    workspace: () => workspaceMutators(),
    /**
     * Returns mutators for the currently active document.
     * Falls back to the first document if no active document is set.
     */
    active: () =>
      documentMutators(store.workspace['x-scalar-active-document'] ?? Object.keys(store.workspace.documents)[0]),
    /**
     * Returns mutators for a specific document by name.
     *
     * @param name - The name of the document
     */
    doc: (name: string) => documentMutators(name),
  }
}
