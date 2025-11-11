/** biome-ignore-all lint/performance/noBarrelFile: Mutators entry point */
import type { WorkspaceStore } from '@/client'
import { cookieMutators } from '@/mutators/cookie'
import { getDocument } from '@/mutators/helpers'
import { requestMutators } from '@/mutators/request'
import { securitySchemeMutators } from '@/mutators/security-schemes'
import type { ServerObject } from '@/schemas/v3.1/strict/openapi-document'

/**
 * Generates a set of mutators for managing OpenAPI document and workspace state.
 *
 * @deprecated use the individual mutators instead, this will be removed after we move fully to the new store
 *
 * @param store - The workspace store containing all documents and workspace-level data
 * @returns An object with mutators for the workspace, the active document, and any named document
 */
export function generateClientMutators(store: WorkspaceStore) {
  /**
   * Provides mutator functions for managing an array of OpenAPI ServerObject entries.
   *
   * @param target - The array of ServerObject to mutate. If not provided, mutators will be no-ops.
   * @returns An object with addServer and deleteServer methods.
   */
  const serverMutators = (target?: ServerObject[]) => {
    /**
     * Adds a new ServerObject to the target array.
     * @param server - The ServerObject to add.
     * @returns true if the server was added, false if target is undefined.
     */
    const addServer = (server: ServerObject): boolean => {
      if (!target) {
        return false
      }
      target.push(server)
      return true
    }

    /**
     * Deletes a ServerObject at the specified index from the target array.
     * @param index - The index of the server to delete.
     * @returns true if the server was deleted, false if target is undefined.
     */
    const deleteServer = (url: string): boolean => {
      if (!target) {
        return false
      }
      const newTarget = [...target.filter((it) => it.url !== url)]
      target.splice(0, target.length)
      target.push(...newTarget)
      return true
    }

    return {
      addServer,
      deleteServer,
    }
  }

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
      requestMutators: requestMutators(document),
      securitySchemeMutators: securitySchemeMutators(document?.components?.securitySchemes),
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

export {
  type AuthMeta,
  deleteSecurityScheme,
  updateSecurityScheme,
  updateSelectedAuthTab,
  updateSelectedScopes,
  updateSelectedSecuritySchemes,
} from './auth'
export { toggleSecurity } from './document'
export {
  upsertEnvironment,
  upsertEnvironmentVariable,
} from './environment'
export {
  type OperationExampleMeta,
  type OperationMeta,
  addOperationParameter,
  addOperationRequestBodyFormRow,
  deleteAllOperationParameters,
  deleteOperationParameter,
  deleteOperationRequestBodyFormRow,
  updateOperationMethodDraft as updateOperationMethod,
  updateOperationParameter,
  updateOperationPathDraft as updateOperationPath,
  updateOperationRequestBodyContentType,
  updateOperationRequestBodyExample,
  updateOperationRequestBodyFormRow,
  updateOperationSummary,
} from './operation'
export {
  addServer,
  deleteServer,
  updateSelectedServer,
  updateServer,
  updateServerVariables,
} from './server'
