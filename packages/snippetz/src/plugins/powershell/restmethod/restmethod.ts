import { restmethod } from '@/httpsnippet-lite/esm/targets/powershell/restmethod/client.mjs'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * powershell/restmethod
 */
export const powershellRestmethod: Plugin = {
  target: 'powershell',
  client: 'restmethod',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(restmethod, request)
  },
}
