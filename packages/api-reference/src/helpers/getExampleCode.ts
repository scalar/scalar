import type {
  Operation,
  RequestExample,
  Server,
} from '@scalar/oas-utils/entities/spec'
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
  operation: Operation,
  example: RequestExample,
  target: TargetId | string,
  client: ClientId<T> | string,
  server: Server | undefined,
) {
  // Convert request to HarRequest
  const harRequest = await convertRequestToHarRequest(
    operation,
    example,
    server,
  )

  // TODO: Fix this, use js (instead of javascript) everywhere
  const snippetzTargetKey = target?.replace(
    'javascript',
    'js',
  ) as SnippetzTargetId

  if (snippetz().hasPlugin(snippetzTargetKey, client)) {
    return snippetz().print(
      snippetzTargetKey,
      client as SnippetzClientId<typeof target>,
      harRequest,
    )
  }

  // Prevent snippet generation if starting by a variable
  // TODO: how do I get to this state?
  // if (request.url.startsWith('__')) {
  //   return request.url
  // }

  return ''
}
