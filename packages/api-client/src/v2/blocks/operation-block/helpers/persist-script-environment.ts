import type { CollectionType } from '@scalar/workspace-store/events'
import type { VariableEntry } from '@scalar/workspace-store/request-example'
import type { XScalarEnvVar } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'

/**
 * A single `environment:upsert:environment-variable` event needed to persist a value
 * that a script set via `pm.environment.set()`. The shape mirrors what the workspace
 * event bus expects, so the caller can emit it directly.
 */
type EnvironmentUpsertAction = {
  environmentName: string
  variable: { name: string; value: string }
  /** Index of the existing variable to update, or undefined to add a new one. */
  index?: number
} & CollectionType

/** Normalize the store's environment scope, which may be an array or a plain record. */
const toEntries = (variables: VariableEntry[] | Record<string, string>): VariableEntry[] =>
  Array.isArray(variables) ? variables : Object.entries(variables).map(([key, value]) => ({ key, value }))

/**
 * Resolve which environment variables a script changed and where to persist them.
 *
 * The active environment is a merge of workspace- and document-scoped variables:
 * `getActiveEnvironment` concatenates them as `[...workspaceVariables, ...documentVariables]`.
 * We use that ordering to map each changed variable back to the scope and index it came
 * from, so updates mutate the correct collection in place instead of creating duplicates.
 * New variables are added to whichever scope actually defines the active environment, so the
 * upsert target exists (the mutator no-ops when the environment is missing from a collection).
 */
export const getEnvironmentPersistenceActions = ({
  environmentName,
  seededVariables,
  scriptVariables,
  mergedVariables,
  documentVariables,
  environmentExistsOnDocument,
}: {
  /** Name of the active environment being written to. */
  environmentName: string
  /** Environment values seeded into the store before the scripts ran. */
  seededVariables: Record<string, string>
  /** Environment scope read back from the store after the scripts ran. */
  scriptVariables: VariableEntry[] | Record<string, string>
  /** The merged (workspace + document) variables of the active environment. */
  mergedVariables: XScalarEnvVar[]
  /** The document-scoped variables of the active environment (appended last in the merge). */
  documentVariables: XScalarEnvVar[]
  /** Whether the active environment is defined on the document (vs. the workspace). */
  environmentExistsOnDocument: boolean
}): EnvironmentUpsertAction[] => {
  // Workspace variables occupy the front of the merged array; document variables the tail.
  const workspaceCount = Math.max(0, mergedVariables.length - documentVariables.length)

  const documentIndexByName = new Map(documentVariables.map((variable, index) => [variable.name, index]))
  const workspaceIndexByName = new Map(
    mergedVariables.slice(0, workspaceCount).map((variable, index) => [variable.name, index]),
  )

  const actions: EnvironmentUpsertAction[] = []

  for (const { key, value } of toEntries(scriptVariables)) {
    // Skip values the script did not touch.
    if (seededVariables[key] === value) {
      continue
    }

    // Update an existing variable in place, preferring the document scope on name
    // collisions since document values win when the environment is merged for reads.
    const documentIndex = documentIndexByName.get(key)
    if (documentIndex !== undefined) {
      actions.push({
        environmentName,
        variable: { name: key, value },
        index: documentIndex,
        collectionType: 'document',
      })
      continue
    }

    const workspaceIndex = workspaceIndexByName.get(key)
    if (workspaceIndex !== undefined) {
      actions.push({
        environmentName,
        variable: { name: key, value },
        index: workspaceIndex,
        collectionType: 'workspace',
      })
      continue
    }

    // New variable — add it to whichever scope holds the active environment.
    actions.push({
      environmentName,
      variable: { name: key, value },
      collectionType: environmentExistsOnDocument ? 'document' : 'workspace',
    })
  }

  return actions
}
