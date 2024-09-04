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

// Type: LoadResult & ValidateResult & UpgradeResult
const result1 = await openapi().load({}).validate().upgrade().get()
console.log(result1.valid, result1.filesystem, result1.version)

// Type: LoadResult & ValidateResult
const result2 = await openapi().load({}).validate().get()
console.log(result2.valid, result2.filesystem)

// Type: LoadResult
const result3 = await openapi().load({}).get()
// @ts-expect-error Valid is not defined
console.log(result3.valid)
