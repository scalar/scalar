import type {
  AnyApiDefinitionFormat,
  OpenApiOptions,
  Queue,
} from '../../types/index.js'
import type { LoadOptions } from '../load/load.js'
import { loadCommand } from './commands/loadCommand.js'

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
