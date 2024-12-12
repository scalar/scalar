import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { restmethod } from '@/httpsnippet-lite/dist/esm/targets/powershell/restmethod/client.mjs'

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
