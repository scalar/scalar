import { restmethod } from '@/httpsnippet-lite/esm/targets/powershell/restmethod/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

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
