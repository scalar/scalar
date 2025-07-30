import type { WorkspaceStore } from '@/client'
import { cookieMutators } from '@/mutators/cookie'
import { environmentMutators } from '@/mutators/environment'
import { getDocument } from '@/mutators/helpers'
import { requestMutators } from '@/mutators/request'
import { requestExampleMutators } from '@/mutators/request-example'
import { securitySchemeMutators } from '@/mutators/security-schemes'
import { serverMutators } from '@/mutators/server'

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
    const document = getDocument(store, documentName)

    if (document) {
      // Make sure the document has a servers array
      if (!document.servers) {
        document.servers = []
      }

      // Make sure the document has the securitySchema object
      if (!document.components) {
        document.components = {}
      }

      if (!document.components.securitySchemes) {
        document.components.securitySchemes = {}
      }
    }

    return {
      requestExampleMutators: requestExampleMutators(document),
      requestMutators: requestMutators(document),
      securitySchemeMutators: securitySchemeMutators(document?.components?.securitySchemes),
      environmentMutators: environmentMutators(document),
      cookieMutators: cookieMutators(document),
      serverMutators: serverMutators(document?.servers),
    }
  }

  /**
   * Returns mutators for the workspace-level configuration.
   *
   * @returns An object containing mutators for environments and cookies at the workspace level
   */
  const workspaceMutators = () => {
    const workspace = store.workspace

    // Make sure the workspace has a servers array
    if (!workspace['x-scalar-client-config-servers']) {
      workspace['x-scalar-client-config-servers'] = []
    }

    // Make sure the workspace has the securitySchema object
    if (!store.workspace['x-scalar-client-config-security-schemes']) {
      store.workspace['x-scalar-client-config-security-schemes'] = {}
    }

    return {
      environmentMutators: environmentMutators(store.workspace),
      cookieMutators: cookieMutators(store.workspace),
      serverMutators: serverMutators(store.workspace['x-scalar-client-config-servers']),
      securitySchemeMutators: securitySchemeMutators(store.workspace['x-scalar-client-config-security-schemes']),
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
      documentMutators(store.workspace['x-scalar-active-document'] ?? Object.keys(store.workspace.documents)[0] ?? ''),
    /**
     * Returns mutators for a specific document by name.
     *
     * @param name - The name of the document
     */
    doc: (name: string) => documentMutators(name),
  }
}
