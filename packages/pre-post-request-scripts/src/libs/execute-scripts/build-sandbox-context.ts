import type { VariableEntry } from '@scalar/workspace-store/request-example'
import { VariableList, VariableScope } from 'postman-collection'

import type { SerializableScopes } from './postman-adapter/sandbox-protocol'

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

type SandboxVariableContext = {
  globals: VariableScope
  collectionVariables: VariableScope
  environment: VariableScope
  data: Record<string, string>
  _variables: VariableScope
}

/**
 * Builds the Postman sandbox context object for variables (globals, environment,
 * collection, data, _variables) from plain key/value scopes. Used so pm.variables.get/set
 * and precedence match Postman behavior.
 *
 * This depends on postman-collection (`VariableScope`) but not on postman-sandbox, and is meant
 * to run inside the sandbox iframe after the scopes have crossed the `postMessage` boundary.
 */
export function buildSandboxContextFromScopes(scopes: SerializableScopes): SandboxVariableContext {
  return {
    globals: new VariableScope(toVariableList(scopes.globals)),
    collectionVariables: new VariableScope(toVariableList(scopes.collectionVariables)),
    environment: new VariableScope(toVariableList(scopes.environment)),
    data: scopes.data,
    _variables: new VariableScope(toVariableList(scopes.local)),
  }
}
