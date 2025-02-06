import { getHarRequest } from '@scalar/api-client/views/Components/CodeSnippet'
import type {
  Operation,
  RequestExample,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { type ClientId, type TargetId, snippetz } from '@scalar/snippetz'

/**
 * Returns a code example for given operation
 */
export function getExampleCode<T extends TargetId>(
  operation: Operation,
  example: RequestExample,
  target: TargetId | string,
  client: ClientId<T> | string,
  server: Server | undefined,
  securitySchemes: SecurityScheme[] = [],
) {
  const harRequest = getHarRequest({
    operation,
    example,
    server,
    securitySchemes,
  })

  // TODO: Fix this, use js (instead of javascript) everywhere
  const snippetzTargetKey = target?.replace('javascript', 'js') as TargetId

  if (snippetz().hasPlugin(snippetzTargetKey, client)) {
    return snippetz().print(
      snippetzTargetKey,
      client as ClientId<TargetId>,
      harRequest,
    )
  }

  return ''
}
