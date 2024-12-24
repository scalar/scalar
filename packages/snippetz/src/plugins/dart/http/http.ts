import { http } from '@/httpsnippet-lite/esm/targets/dart/http/client'
import type { Plugin } from '@/types'
import { convertWithHttpSnippetLite } from '@/utils/convertWithHttpSnippetLite'

/**
 * dart/http
 */
export const dartHttp: Plugin = {
  target: 'dart',
  client: 'http',
  title: 'Http',
  generate(request) {
    // TODO: Write an own converter
    return convertWithHttpSnippetLite(http, request)
  },
}
