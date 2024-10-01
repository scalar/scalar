import type { OpenApiDocumentTask } from '@/packages/openapi-sdk/hooks/useOpenApiDocument'
import { normalize } from '@scalar/openapi-parser'

/**
 * Get an OpenAPI Document and prepare it for the rendering
 */

export async function handle(
  content: string | Record<string, any>,
  tasks: OpenApiDocumentTask[],
) {
  return tasks.reduce(
    async (acc, nextTask) => {
      return nextTask(await acc)
    },
    Promise.resolve(normalize(content)),
  )
}
