import type { VariableEntry, VariablesStore } from '@scalar/workspace-store/request-example'
import { VariableList, VariableScope } from 'postman-collection'

import { getVariableScopesFromStore } from './variables-store'

function toVariableList(entries: VariableEntry[]): VariableList {
  if (entries.length === 0) {
    // @ts-expect-error - VariableList constructor expects a Property<PropertyDefinition>
    return new VariableList(null, [])
  }
  return new VariableList(
    // @ts-expect-error - VariableList constructor expects a Property<PropertyDefinition>
    null,
    entries.map((e) => ({ key: e.key, value: e.value })),
  )
}

/**
 * Builds the Postman sandbox context object for variables (globals, environment,
 * collection, data, _variables) from a VariablesStore. Used so pm.variables.get/set
 * and precedence match Postman behavior.
 */
export function buildSandboxContextFromStore(store: VariablesStore): {
  globals: VariableScope
  collectionVariables: VariableScope
  environment: VariableScope
  data: Record<string, string>
  _variables: VariableScope
} {
  const scopes = getVariableScopesFromStore(store)
  return {
    globals: new VariableScope(toVariableList(scopes.globals)),
    collectionVariables: new VariableScope(toVariableList(scopes.collectionVariables)),
    environment: new VariableScope(toVariableList(scopes.environment)),
    data: scopes.data,
    _variables: new VariableScope(toVariableList(scopes.local)),
  }
}
