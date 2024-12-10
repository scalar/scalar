import { webrequest } from '@/httpsnippet-lite/esm/targets/powershell/webrequest/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

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
