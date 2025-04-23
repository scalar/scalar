import { restmethod } from '@/httpsnippet-lite/esm/targets/powershell/restmethod/client'
import { convertWithHttpSnippetLite } from '@/utils/convert-with-http-snippet-lite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * powershell/restmethod
 */
export const powershellRestmethod: Plugin = {
  target: 'powershell',
  client: 'restmethod',
  title: 'Invoke-RestMethod',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(restmethod, request)
  },
}
