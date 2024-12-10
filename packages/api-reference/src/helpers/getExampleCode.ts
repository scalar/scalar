import {
  type ClientId as SnippetzClientId,
  type TargetId as SnippetzTargetId,
  snippetz,
} from '@scalar/snippetz'

import { convertRequestToHarRequest } from '../helpers/convertRequestToHarRequest'

export type TargetId = SnippetzTargetId
export type ClientId<T extends SnippetzTargetId> = SnippetzClientId<T>

/**
 * Returns a code example for given Request
 */
export async function getExampleCode<T extends SnippetzTargetId>(
  request: Request,
  target: TargetId,
  client: ClientId<T>,
) {
  // Convert request to HarRequest
  const harRequest = await convertRequestToHarRequest(request)

  // @scalar/snippetz
  const snippetzTargetKey = target

  if (snippetz().hasPlugin(snippetzTargetKey, client)) {
    return snippetz().print(
      target as SnippetzTargetId,
      client as SnippetzClientId<typeof target>,
      harRequest,
    )
  }

  // Prevent snippet generation if starting by a variable
  if (request.url.startsWith('__')) {
    return request.url
  }

  return ''
}
