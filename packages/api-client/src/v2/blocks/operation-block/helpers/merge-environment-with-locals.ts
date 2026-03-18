import type { VariableEntry } from '@scalar/oas-utils/helpers'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'

/**
 * Merges base environment variables with local variables from scripts (e.g. set via
 * pm.variables.set in pre-request/post-response). Local entries override by name.
 * Used when running multiple requests in sequence so the next request sees
 * variables set by the previous request's scripts.
 *
 * @param environment Base environment (e.g. selected workspace + document env)
 * @param localVariables Local variables from VariablesStore.getLocalVariables()
 * @returns A new XScalarEnvironment with variables = base + locals (locals override)
 */
export function mergeEnvironmentWithLocals(
  environment: XScalarEnvironment,
  localVariables: VariableEntry[] | Record<string, string>,
): XScalarEnvironment {
  const base = environment.variables ?? []
  const entries = Array.isArray(localVariables)
    ? localVariables
    : Object.entries(localVariables).map(([key, value]) => ({ key, value }))

  const byName = new Map<string, string>()

  for (const v of base) {
    const value = typeof v.value === 'string' ? v.value : v.value.default
    byName.set(v.name, value)
  }
  for (const e of entries) {
    byName.set(e.key, e.value)
  }

  const variables = Array.from(byName.entries()).map(([name, value]) => ({
    name,
    value,
  }))

  return {
    ...environment,
    variables,
  }
}
