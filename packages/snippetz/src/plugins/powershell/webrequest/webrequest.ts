import { webrequest } from '@/httpsnippet-lite/esm/targets/powershell/webrequest/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * powershell/webrequest
 */
export const powershellWebrequest: Plugin = {
  target: 'powershell',
  client: 'webrequest',
  title: 'Invoke-WebRequest',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(webrequest, request)
  },
}
