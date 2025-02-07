import type {
  Operation,
  RequestExample,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { type ClientId, type TargetId, snippetz } from '@scalar/snippetz'

import { getHarRequest } from './get-har-request'

/** Key used to hack around the invalid urls */
const INVALID_URLS_PREFIX = 'ws://replace.me'

/**
 * Returns a code example for given operation
 */
export const getSnippet = <T extends TargetId>(
  target: T | 'javascript',
  client: ClientId<T>,
  {
    operation,
    example,
    server,
    securitySchemes = [],
  }: {
    operation?: Operation
    example?: RequestExample
    server?: Server | undefined
    securitySchemes?: SecurityScheme[]
  },
): string => {
  const harRequest = getHarRequest({
    operation,
    example,
    server,
    securitySchemes,
  })

  if (!harRequest.url) return ''
  const separator = harRequest.url.startsWith('/') ? '' : '/'

  // Hack to get around invalid URLS until we update the snippets lib
  try {
    new URL(harRequest.url)
  } catch (error) {
    harRequest.url = `${INVALID_URLS_PREFIX}${separator}${harRequest.url}`
  }

  // TODO: Fix this, use js (instead of javascript) everywhere
  const snippetzTargetKey = target.replace('javascript', 'js') as TargetId

  if (snippetz().hasPlugin(snippetzTargetKey, client)) {
    return (
      snippetz().print(
        snippetzTargetKey,
        client as ClientId<TargetId>,
        harRequest,
      ) ?? ''
    ).replace(`${INVALID_URLS_PREFIX}${separator}`, '')
  }

  return ''
}
