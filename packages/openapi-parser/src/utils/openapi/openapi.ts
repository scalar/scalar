import type {
  AnyApiDefinitionFormat,
  OpenApiOptions,
  Queue,
} from '../../types/index.ts'
import type { LoadOptions } from '../load/load.ts'
import { loadCommand } from './commands/loadCommand.ts'

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
