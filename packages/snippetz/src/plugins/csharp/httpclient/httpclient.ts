import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { httpclient } from '@/httpsnippet-lite/dist/esm/targets/csharp/httpclient/client.mjs'

/**
 * csharp/httpclient
 */
export const csharpHttpclient: Plugin = {
  target: 'csharp',
  client: 'httpclient',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(httpclient, request)
  },
}
