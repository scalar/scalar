import type { CollectionType } from '@scalar/workspace-store/events'
import type { VariableEntry } from '@scalar/workspace-store/request-example'
import type { XScalarEnvVar } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'

/**
 * A single change to persist to the active environment in response to a script's
 * `pm.environment.set()` / `pm.environment.unset()`. Shapes mirror the workspace event
 * bus payloads (`environment:upsert:environment-variable` / `:delete:environment-variable`)
 * so the caller can emit each action directly.
 */
type EnvironmentPersistenceAction = { environmentName: string } & CollectionType &
  ({ type: 'upsert'; variable: { name: string; value: string }; index?: number } | { type: 'delete'; index: number })

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
 *
 * Variables present before the scripts ran but gone afterwards were removed via
 * `pm.environment.unset()` and are emitted as deletes. Deletes splice the underlying array,
 * so they are ordered last and by descending index — an earlier splice must not invalidate the
 * index of a later one. Upserts run first because they replace in place without shifting.
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
}): EnvironmentPersistenceAction[] => {
  // Workspace variables occupy the front of the merged array; document variables the tail.
  const workspaceCount = Math.max(0, mergedVariables.length - documentVariables.length)

  const documentIndexByName = new Map(documentVariables.map((variable, index) => [variable.name, index]))
  const workspaceIndexByName = new Map(
    mergedVariables.slice(0, workspaceCount).map((variable, index) => [variable.name, index]),
  )

  /**
   * Locate an existing variable by name, preferring the document scope on collisions since
   * document values win when the environment is merged for reads.
   */
  const findExisting = (
    key: string,
  ): { collectionType: CollectionType['collectionType']; index: number } | undefined => {
    const documentIndex = documentIndexByName.get(key)
    if (documentIndex !== undefined) {
      return { collectionType: 'document', index: documentIndex }
    }
    const workspaceIndex = workspaceIndexByName.get(key)
    if (workspaceIndex !== undefined) {
      return { collectionType: 'workspace', index: workspaceIndex }
    }
    return undefined
  }

  const upserts: EnvironmentPersistenceAction[] = []
  const deletes: Array<Extract<EnvironmentPersistenceAction, { type: 'delete' }>> = []
  const scriptKeys = new Set<string>()

  for (const { key, value } of toEntries(scriptVariables)) {
    scriptKeys.add(key)

    // Skip values the script did not touch.
    if (seededVariables[key] === value) {
      continue
    }

    const existing = findExisting(key)
    if (existing) {
      // Update an existing variable in place.
      upserts.push({ type: 'upsert', environmentName, variable: { name: key, value }, ...existing })
    } else {
      // New variable — add it to whichever scope holds the active environment.
      upserts.push({
        type: 'upsert',
        environmentName,
        variable: { name: key, value },
        collectionType: environmentExistsOnDocument ? 'document' : 'workspace',
      })
    }
  }

  // Removals: keys present before the scripts ran but absent afterwards (pm.environment.unset).
  // Delete from every scope that defines the name — not just the one that wins on reads. A copy
  // left behind in another scope would resurface on the next seed, so the unset would not stick.
  for (const key of Object.keys(seededVariables)) {
    if (scriptKeys.has(key)) {
      continue
    }
    const documentIndex = documentIndexByName.get(key)
    if (documentIndex !== undefined) {
      deletes.push({ type: 'delete', environmentName, index: documentIndex, collectionType: 'document' })
    }
    const workspaceIndex = workspaceIndexByName.get(key)
    if (workspaceIndex !== undefined) {
      deletes.push({ type: 'delete', environmentName, index: workspaceIndex, collectionType: 'workspace' })
    }
  }

  // Highest index first so each splice leaves lower indices — including cross-scope ones,
  // which live in independent arrays — valid for the deletes that follow.
  deletes.sort((a, b) => b.index - a.index)

  return [...upserts, ...deletes]
}
