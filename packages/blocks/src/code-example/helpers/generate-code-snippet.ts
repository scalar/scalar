import type { ClientId, TargetId } from '@scalar/types/snippetz'

import { type GenerateCodeSnippetProps, prepareCodeSnippet } from './generate-code-snippet-with-plugin'
import { getSnippet } from './get-snippet'

/** Generate a snippet synchronously using the complete generator registry. */
export const generateCodeSnippet = (props: GenerateCodeSnippetProps): string => {
  const prepared = prepareCodeSnippet(props)
  if (typeof prepared === 'string') {
    return prepared
  }
  const [target, client] = props.clientId!.split('/') as [TargetId, ClientId<TargetId>]
  const [error, payload] = getSnippet(target, client, prepared)
  if (error) {
    console.error('[generateCodeSnippet]', error)
    return error.message ?? 'Error generating code snippet'
  }
  return payload
}
