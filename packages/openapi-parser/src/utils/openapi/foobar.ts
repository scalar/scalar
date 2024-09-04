import type { AnyApiDefinitionFormat } from '../../types'
import { loadCommand } from './loadCommand'

/**
 * Creates a fluent OpenAPI pipeline
 */
export function openapi() {
  return {
    load: (input: AnyApiDefinitionFormat) => loadCommand(input),
  }
}

// Type: LoadResult & ValidateResult
const result1 = await openapi().load({}).validate().get()

// Type: LoadResult
const result2 = await openapi().load({}).get()

console.log(result1.valid, result1.filesystem)
// @ts-expect-error Valid is not defined
console.log(result2.valid)
