import { asynchttp } from '@/httpsnippet-lite/esm/targets/java/asynchttp/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * java/asynchttp
 */
export const javaAsynchttp: Plugin = {
  target: 'java',
  client: 'asynchttp',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(asynchttp, request)
  },
}
