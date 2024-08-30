import {
  type Request,
  type ClientId as SnippetzClientId,
  type TargetId as SnippetzTargetId,
  snippetz,
} from '@scalar/snippetz'
import {
  HTTPSnippet,
  type ClientId as HttpSnippetLiteClientId,
  type TargetId as HttpSnippetLiteTargetId,
} from 'httpsnippet-lite'

export type TargetId = HttpSnippetLiteTargetId | SnippetzTargetId
export type ClientId = HttpSnippetLiteClientId | SnippetzClientId

/**
 * Returns a code example for given HAR request
 */
export async function getExampleCode(
  request: Request,
  target: TargetId,
  client: ClientId,
) {
  // @scalar/snippetz
  const snippetzTargetKey = target.replace('javascript', 'js')

  if (snippetz().hasPlugin(snippetzTargetKey, client)) {
    return snippetz().print(
      target as SnippetzTargetId,
      client as SnippetzClientId,
      request,
    )
  }

  // httpsnippet-lite
  try {
    return (
      (await new HTTPSnippet(request).convert(
        target as HttpSnippetLiteTargetId,
        client as HttpSnippetLiteClientId,
      )) ?? ''
    )
  } catch (error) {
    console.error(
      '[getExampleCode] Failed to generate example code with httpsnippet-lite:',
      error,
    )
  }

  return ''
}
