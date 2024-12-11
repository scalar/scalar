import {
  type ClientId as SnippetzClientId,
  type TargetId as SnippetzTargetId,
  snippetz,
} from '@scalar/snippetz'

import { convertRequestToHarRequest } from '../helpers/convertRequestToHarRequest'

export type TargetId = SnippetzTargetId
export type ClientId<T extends SnippetzTargetId> = SnippetzClientId<T>

const { hasPlugin, print } = snippetz()

/**
 * Returns a code example for given Request
 */
export async function getExampleCode<T extends SnippetzTargetId>(
  request: Request,
  target: TargetId | string,
  client: ClientId<T> | string,
) {
  // Convert request to HarRequest
  const harRequest = await convertRequestToHarRequest(request)

  // TODO: Fix this, use js (instead of javascript) everywhere
  const snippetzTargetKey = target?.replace(
    'javascript',
    'js',
  ) as SnippetzTargetId

  if (hasPlugin(snippetzTargetKey, client)) {
    return print(
      snippetzTargetKey,
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
