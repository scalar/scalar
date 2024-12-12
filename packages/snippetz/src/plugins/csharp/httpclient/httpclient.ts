import { httpclient } from '@/httpsnippet-lite/esm/targets/csharp/httpclient/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

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
