import type { Plugin } from '@scalar/types/snippetz'

import { webrequest } from '@/httpsnippet-lite/targets/powershell/webrequest/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

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
