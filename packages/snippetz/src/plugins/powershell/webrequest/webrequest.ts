import type { Plugin } from '@/core'
import { convertWithHttpSnippetLite } from '@/core/utils/convertWithHttpSnippetLite'
// @ts-expect-error no types available
import { webrequest } from '@/httpsnippet-lite/dist/esm/targets/powershell/webrequest/client.mjs'

/**
 * powershell/webrequest
 */
export const powershellWebrequest: Plugin = {
  target: 'powershell',
  client: 'webrequest',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(webrequest, request)
  },
}
