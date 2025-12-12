import type { Plugin } from '@scalar/types/snippetz'

import { restsharp } from '@/httpsnippet-lite/targets/csharp/restsharp/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * csharp/restsharp
 */
export const csharpRestsharp: Plugin = {
  target: 'csharp',
  client: 'restsharp',
  title: 'RestSharp',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(restsharp, request)
  },
}
