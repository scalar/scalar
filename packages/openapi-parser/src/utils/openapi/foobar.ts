import type { AnyApiDefinitionFormat, OpenApiOptions, Queue } from '../../types'
import type { LoadOptions } from '../load'
import { loadCommand } from './loadCommand'

/**
 * Creates a fluent OpenAPI pipeline
 */
export function openapi(globalOptions?: OpenApiOptions) {
  // Create a new queue
  const queue = {
    input: null,
    options: globalOptions,
    tasks: [],
  } as Queue<[]>

  return {
    load: (input: AnyApiDefinitionFormat, options?: LoadOptions) =>
      loadCommand(queue, input, options),
  }
}

// Type: LoadResult & ValidateResult
const result1 = await openapi().load({}).validate().get()

// Type: LoadResult
const result2 = await openapi().load({}).get()

console.log(result1.valid, result1.filesystem)
// @ts-expect-error Valid is not defined
console.log(result2.valid)
