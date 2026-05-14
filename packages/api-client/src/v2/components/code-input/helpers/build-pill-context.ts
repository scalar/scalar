import {
  type ContextFunctionName,
  getContextFunctionComment,
  isContextFunctionName,
} from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'

import type { PillContext } from '../pill-context'

/** Resolve a variable name to its value in the given environment, if any. */
const lookupVariableValue = (environment: XScalarEnvironment | undefined, name: string): string | undefined => {
  const variable = environment?.variables?.find((entry) => entry.name === name)
  if (!variable) {
    return undefined
  }
  return typeof variable.value === 'string' ? variable.value : variable.value?.default
}

/**
 * Build the tooltip context shown when hovering a pill.
 *
 * `{{$contextFunctions}}` describe what they generate at send time, while
 * regular environment variables show the resolved value (or a "not defined"
 * fallback when the environment does not declare them).
 */
export const buildPillContext = (variableName: string, environment: XScalarEnvironment | undefined): PillContext => {
  if (isContextFunctionName(variableName)) {
    return {
      type: 'contextFunction',
      identifier: variableName,
      details: getContextFunctionComment(variableName as ContextFunctionName),
    }
  }
  const value = lookupVariableValue(environment, variableName)
  return {
    type: 'environment',
    name: variableName,
    value: value || 'No value',
    isDefined: Boolean(value),
  }
}
