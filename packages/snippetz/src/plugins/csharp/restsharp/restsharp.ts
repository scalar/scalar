import { restsharp } from '@/httpsnippet-lite/esm/targets/csharp/restsharp/client.mjs'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * csharp/restsharp
 */
export const csharpRestsharp: Plugin = {
  target: 'csharp',
  client: 'restsharp',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(restsharp, request)
  },
}
