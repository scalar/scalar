import { Type } from '@scalar/typebox'

/**
 * The name of a parameter (like "Content-Type" or "Authorization").
 * Used as keys in parameter state mappings.
 */
type ParameterName = string

/**
 * The key identifying an example (like "default" or "auth-example").
 * Used to separate parameter states across different examples.
 */
type ExampleKey = string

/**
 * Maps parameter names to their disabled state for a single example.
 * A parameter is disabled when its value is true, enabled when false.
 *
 * @example
 * {
 *   "Content-Type": true,  // This parameter is disabled
 *   "Accept": false         // This parameter is enabled
 * }
 */
type ExampleParameterState = Record<ParameterName, boolean>

/**
 * Maps example keys to their parameter disabled states.
 * Each example can have a different set of disabled parameters.
 *
 * @example
 * {
 *   "default": { "Content-Type": true },
 *   "auth-example": { "Authorization": false }
 * }
 */
type ExamplesParameterStates = Record<ExampleKey, ExampleParameterState>

/**
 * Configuration for disabled parameters across different parameter categories.
 * Organizes parameter states by their type (global cookies, headers, etc.).
 */
export type DisableParametersConfig = {
  /**
   * Tracks disabled state for global cookie parameters across examples.
   * Global cookies are shared across all operations in the workspace.
   */
  'global-cookies'?: ExamplesParameterStates
  /**
   * Tracks disabled state for global header parameters across examples.
   * Global headers are shared across all operations in the workspace.
   */
  'global-headers'?: ExamplesParameterStates
  /**
   * Tracks disabled state for default header parameters across examples.
   * Default headers are automatically injected by the client (like Content-Type).
   */
  'default-headers'?: ExamplesParameterStates
}

/**
 * Schema for parameter disabled states within a single example.
 * Maps parameter names (strings) to their disabled state (boolean).
 */
const ExampleParameterStateSchema = Type.Record(Type.String(), Type.Boolean())

/**
 * Schema for all example parameter states across multiple examples.
 * Maps example keys (strings) to their parameter disabled states.
 */
const ExamplesParameterStatesSchema = Type.Record(Type.String(), ExampleParameterStateSchema)

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
export const XScalarDisableParametersSchema = Type.Object({
  'x-scalar-disable-parameters': Type.Optional(
    Type.Object({
      'global-cookies': Type.Optional(ExamplesParameterStatesSchema),
      'global-headers': Type.Optional(ExamplesParameterStatesSchema),
      'default-headers': Type.Optional(ExamplesParameterStatesSchema),
    }),
  ),
})

/**
 * Type definition for the x-scalar-disable-parameters extension.
 * Allows tracking disabled state for different parameter categories across examples.
 */
export type XScalarDisableParameters = {
  'x-scalar-disable-parameters'?: DisableParametersConfig
}
