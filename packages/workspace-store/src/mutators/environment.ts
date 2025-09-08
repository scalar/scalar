import type { UnknownObject } from '@/helpers/general'
import type {
  XScalarClientConfigEnvironments,
  xScalarClientConfigEnvironment,
} from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-environments'

/**
 * Environment mutators for managing client configuration environments in OpenAPI documents.
 * Provides functions to add and delete environments from the document's x-scalar-client-config-environments extension.
 *
 * @param store - The workspace store containing the documents
 * @param documentName - The name of the document to operate on
 * @returns Object containing addEnvironment and deleteEnvironment functions
 */
export const environmentMutators = (
  document?: UnknownObject & { 'x-scalar-client-config-environments'?: XScalarClientConfigEnvironments },
) => {
  /**
   * Adds a new environment to the document's client configuration.
   * If an environment with the same name already exists, it will log a warning and return false.
   *
   * @param name - The name of the environment to add
   * @param environment - The environment configuration to add
   * @returns true if the environment was added successfully, false if it already exists or document is missing
   *
   * @example
   * // Add a new development environment
   * const success = addEnvironment('development', {
   *   variables: { apiUrl: 'https://dev.example.com/api' }
   * })
   *
   * if (success) {
   *   console.log('Environment added successfully')
   * } else {
   *   console.log('Environment already exists')
   * }
   */
  const addEnvironment = (name: string, environment: xScalarClientConfigEnvironment) => {
    if (!document) {
      return false
    }

    if (!document['x-scalar-client-config-environments']) {
      document['x-scalar-client-config-environments'] = {}
    }

    if (document['x-scalar-client-config-environments'][name]) {
      console.warn(`Environment with name "${name}" already exists in the document.`)
      return false
    }

    document['x-scalar-client-config-environments'][name] = environment
    return true
  }

  /**
   * Removes an environment from the document's x-scalar-client-config-environments extension by its name.
   * Returns false if the document or environments object does not exist, otherwise deletes the environment and returns true.
   *
   * @param environmentName - The name of the environment to remove
   * @returns true if the environment was deleted, false otherwise
   *
   * @example
   * // Remove a development environment
   * deleteEnvironment('development')
   */
  const deleteEnvironment = (environmentName: string) => {
    if (!document || !document['x-scalar-client-config-environments']) {
      return false
    }

    delete document['x-scalar-client-config-environments'][environmentName]
    return true
  }

  return {
    addEnvironment,
    deleteEnvironment,
  }
}
