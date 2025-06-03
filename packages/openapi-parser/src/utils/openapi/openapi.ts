import type { AnyApiDefinitionFormat, OpenApiOptions, Queue } from '@/types/index'
import type { LoadOptions } from '@/utils/load/load'
import { loadCommand } from './commands/loadCommand'

/**
 * Creates a fluent OpenAPI pipeline
 *
 * @deprecated We are about to drop the pipeline syntax. Use the individual utilities instead.
 */
export function openapi(globalOptions?: OpenApiOptions) {
  // Create a new queue
  const queue = {
    input: null,
    options: globalOptions,
    tasks: [],
  } as Queue<[]>

  return {
    load: (input: AnyApiDefinitionFormat, options?: LoadOptions) => loadCommand(queue, input, options),
  }
}
