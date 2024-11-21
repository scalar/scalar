import { convertRequestToHarRequest } from '@/helpers/convertRequestToHarRequest'
import {
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
 * Returns a code example for given Request
 */
export async function getExampleCode(
  request: Request,
  target: TargetId,
  client: ClientId,
) {
  // Convert request to HarRequest
  const harRequest = await convertRequestToHarRequest(request)

  if (snippetz().hasPlugin(target, client)) {
    // Transform harRequest to match snippetz's expected format
    const snippetzRequest = {
      ...harRequest,
      postData: harRequest.postData
        ? {
            text: harRequest.postData.text || '',
            mimeType: harRequest.postData.mimeType,
            ...(harRequest.postData.comment && {
              comment: harRequest.postData.comment,
            }),
          }
        : undefined,
    }

    return snippetz().print(
      target as SnippetzTargetId,
      client as SnippetzClientId,
      snippetzRequest,
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
