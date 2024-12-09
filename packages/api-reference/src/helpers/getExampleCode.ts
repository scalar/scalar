import {
  type ClientId as SnippetzClientId,
  type Request as SnippetzRequest,
  type TargetId as SnippetzTargetId,
  snippetz,
} from '@scalar/snippetz'
import {
  HTTPSnippet,
  type ClientId as HttpSnippetLiteClientId,
  type TargetId as HttpSnippetLiteTargetId,
} from 'httpsnippet-lite'

import { convertRequestToHarRequest } from '../helpers/convertRequestToHarRequest'

export type TargetId = HttpSnippetLiteTargetId | SnippetzTargetId
export type ClientId<T extends SnippetzTargetId> =
  | HttpSnippetLiteClientId
  | SnippetzClientId<T>

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
      // TODO: We shouldn’t cast the type here.
      // Luckily, the difference between those two types is tiny. We’ll get rid of this compatibility issue soon.
      harRequest as SnippetzRequest,
    )
  }

  // Prevent snippet generation if starting by a variable
  if (request.url.startsWith('__')) {
    return request.url
  }

  // httpsnippet-lite
  try {
    const httpSnippetLiteTargetKey = target?.replace(
      'js',
      'javascript',
    ) as HttpSnippetLiteTargetId
    const httpSnippetLiteClientKey = client as HttpSnippetLiteClientId

    // HTTPSnippet will return type string[] if passed input type HarEntry
    // Since we are passing type HarRequest output is a string
    const code = await new HTTPSnippet(harRequest).convert(
      httpSnippetLiteTargetKey,
      httpSnippetLiteClientKey,
    )
    if (typeof code === 'string') return code
  } catch (error) {
    console.error(
      '[getExampleCode] Failed to generate example code with httpsnippet-lite:',
      error,
    )
  }

  return ''
}
