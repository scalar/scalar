import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'

/**
 * Resolve a variable name to its value in the given environment, if any.
 *
 * Variable values can be a plain string or a structured object with a
 * `default` field (and optional metadata such as `description`); both shapes
 * are flattened to a single string here. Returns `undefined` when the
 * environment is missing or does not declare the variable.
 */
export const lookupVariableValue = (environment: XScalarEnvironment | undefined, name: string): string | undefined => {
  const variable = environment?.variables?.find((entry) => entry.name === name)
  if (!variable) {
    return undefined
  }
  return typeof variable.value === 'string' ? variable.value : variable.value?.default
}
