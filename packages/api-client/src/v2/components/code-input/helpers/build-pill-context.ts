import {
  type ContextFunctionName,
  getContextFunctionComment,
  isContextFunctionName,
} from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'

import type { PillContext } from '../pill-context'
import { lookupVariableValue } from './lookup-variable-value'

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
