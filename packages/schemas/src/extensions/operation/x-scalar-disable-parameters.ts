import { boolean, object, optional, record, string } from '@scalar/validation'

import { typeCommentExample, typeCommentSections } from '../type-comment'

/**
 * Custom OpenAPI extension to track which parameters are disabled across different contexts.
 *
 * This extension allows the API client to persist disabled states for different types of
 * parameters (global cookies, global headers, default headers) across multiple examples.
 *
 * This is necessary because:
 * - Different parameter types have different scopes and behaviors
 * - Users need to disable specific parameters per example without affecting others
 * - The disabled state must persist across sessions
 * - Global parameters can be disabled independently of operation-specific ones
 *
 * Structure:
 * - Top level: Parameter category ("global-cookies", "global-headers", "default-headers")
 * - Second level: Example keys (like "default", "custom-example")
 * - Third level: Parameter names (like "Content-Type", "Cookie")
 * - Values: true = disabled, false = enabled
 *
 * @example
 * ```json
 * {
 *   "x-scalar-disable-parameters": {
 *     "global-cookies": {
 *       "default": {
 *         "session": true
 *       }
 *     },
 *     "global-headers": {
 *       "default": {
 *         "X-API-Key": false
 *       }
 *     },
 *     "default-headers": {
 *       "default": {
 *         "Content-Type": true,
 *         "Accept": false
 *       }
 *     }
 *   }
 * }
 * ```
 */
const ExampleParameterState = record(string(), boolean())

const ExamplesParameterStates = record(string(), ExampleParameterState)

const DisableParametersInner = object(
  {
    'global-cookies': optional(ExamplesParameterStates, {
      typeComment: 'Disabled state for global cookie parameters across examples',
    }),
    'global-headers': optional(ExamplesParameterStates, {
      typeComment: 'Disabled state for global header parameters across examples',
    }),
    'default-headers': optional(ExamplesParameterStates, {
      typeComment: 'Disabled state for default header parameters across examples',
    }),
  },
  {
    typeName: 'DisableParametersConfig',
    typeComment: 'Disabled parameter state by category and example',
  },
)

export const XScalarDisableParameters = object(
  {
    'x-scalar-disable-parameters': optional(DisableParametersInner, {
      typeComment: 'Disabled parameter state organized by category, example, and parameter name',
    }),
  },
  {
    typeName: 'XScalarDisableParameters',
    typeComment: typeCommentSections(
      'Tracks which parameters are disabled across examples in the API client.',
      'Structure: category (global-cookies, global-headers, default-headers) → example key → parameter name → true if disabled.',
      typeCommentExample(
        'json',
        `{
  "x-scalar-disable-parameters": {
    "default-headers": {
      "default": { "Content-Type": true, "Accept": false }
    }
  }
}`,
      ),
    ),
  },
)
