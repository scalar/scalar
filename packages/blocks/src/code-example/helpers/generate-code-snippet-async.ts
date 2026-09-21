import { loadPlugin } from '@scalar/snippetz/lazy'

import {
  type GenerateCodeSnippetProps,
  prepareCodeSnippet,
  renderCodeSnippet,
} from './generate-code-snippet-with-plugin'

/** Generate a snippet after loading only the selected client implementation. */
export const generateCodeSnippetAsync = async (props: GenerateCodeSnippetProps): Promise<string> => {
  try {
    // Prepare before awaiting so Vue tracks nested request and authentication edits.
    const prepared = prepareCodeSnippet(props)
    if (typeof prepared === 'string') {
      return prepared
    }
    const plugin =
      props.clientId && !props.clientId.startsWith('custom/') ? await loadPlugin(props.clientId) : undefined
    return renderCodeSnippet(prepared, plugin)
  } catch (error) {
    console.error('[generateCodeSnippetAsync]', error)
    return 'Error generating code snippet'
  }
}
