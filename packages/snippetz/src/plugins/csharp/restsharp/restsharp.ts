import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { restsharp } from '@/httpsnippet-lite/dist/esm/targets/csharp/restsharp/client.mjs'

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
