import type { ErrorResponse } from '@scalar/helpers/errors/normalize-error'
import type { Plugin } from '@scalar/types/snippetz'
import type { Request as HarRequest } from 'har-format'

/** Key used to hack around the invalid urls */
const INVALID_URLS_PREFIX = 'ws://replace.me'

/**
 * Returns a code example for given operation
 */
export const getSnippetWithPlugin = (harRequest: HarRequest, plugin: Plugin | undefined): ErrorResponse<string> => {
  try {
    if (!harRequest.url) {
      return [new Error('Please enter a URL to see a code snippet'), null]
    }

    const separator = harRequest.url.startsWith('/') ? '' : '/'

    // Hack to get around invalid URLS until we update the snippets lib
    try {
      new URL(harRequest.url)
    } catch {
      harRequest.url = `${INVALID_URLS_PREFIX}${separator}${harRequest.url}`
    }

    // Ensure we have valid JSON
    if (harRequest.postData?.mimeType === 'application/json') {
      try {
        JSON.parse(harRequest.postData.text || '{}')
      } catch (error) {
        console.error('[getSnippet] Invalid JSON body', error)
        return [new Error('Invalid JSON body'), null]
      }
    }
    if (plugin) {
      const payload = plugin.generate(harRequest)
      if (!payload) {
        return [new Error('Error generating snippet'), null]
      }

      return [null, payload.replace(`${INVALID_URLS_PREFIX}${separator}`, '')]
    }
  } catch (error) {
    console.error('[getSnippet] Error generating snippet', error)
    return [new Error('Error generating snippet'), null]
  }

  return [new Error('No snippet found'), null]
}
