import { asynchttp } from '@/httpsnippet-lite/esm/targets/java/asynchttp/client'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'
import type { Plugin } from '@scalar/types/snippetz'

/**
 * java/asynchttp
 */
export const javaAsynchttp: Plugin = {
  target: 'java',
  client: 'asynchttp',
  title: 'AsyncHttp',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(asynchttp, request)
  },
}
