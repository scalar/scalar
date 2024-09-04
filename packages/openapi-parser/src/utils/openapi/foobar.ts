import type { AnyApiDefinitionFormat, ThrowOnErrorOption } from '../../types'
import type { LoadOptions } from '../load'
import { loadCommand } from './loadCommand'

/**
 * Options, that can apply to all commands
 */
export type OpenApiOptions = ThrowOnErrorOption

/**
 * Creates a fluent OpenAPI pipeline
 */
export function openapi(globalOptions?: OpenApiOptions) {
  return {
    load: (input: AnyApiDefinitionFormat, options?: LoadOptions) =>
      loadCommand(input, {
        ...(globalOptions ?? {}),
        ...(options ?? {}),
      }),
  }
}

// Type: LoadResult & ValidateResult
const result1 = await openapi().load({}).validate().get()

// Type: LoadResult
const result2 = await openapi().load({}).get()

console.log(result1.valid, result1.filesystem)
// @ts-expect-error Valid is not defined
console.log(result2.valid)
