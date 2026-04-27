import type { ParameterObject } from './parameter'
/**
 * Parameters Definitions object
 *
 * An object to hold parameters to be reused across operations. Parameter definitions can be referenced to the ones defined here.  This does *not* define global operation parameters.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#parameters-definitions-object}
 */
export type ParameterDefinitionsObject = {
  [key: string]: ParameterObject
}
