import { httpclient } from '@/httpsnippet-lite/esm/targets/csharp/httpclient/client'
import { convertWithHttpSnippetLite } from '@/utils/convert-with-http-snippet-lite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * csharp/httpclient
 */
export const csharpHttpclient: Plugin = {
  target: 'csharp',
  client: 'httpclient',
  title: 'HttpClient',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(httpclient, request)
  },
}
