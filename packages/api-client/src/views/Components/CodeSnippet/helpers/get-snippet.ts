import type { ErrorResponse } from '@/libs/errors'
import { type ClientId, type TargetId, snippetz } from '@scalar/snippetz'
import type { Request as HarRequest } from 'har-format'
import { getApiKeyValue } from '@/libs/api-key-manager'

/** Key used to hack around the invalid urls */
const INVALID_URLS_PREFIX = 'ws://replace.me'

/**
 * Decode specific URL-encoded characters to make URLs more readable
 * Whitelisted characters that should be decoded back to original form
 */
const decodeWhitelistedCharacters = (url: string): string => {
  return url
    .replace(/%3A/g, ':') // Decode colons
    .replace(/%2C/g, ',') // Decode commas
}

const injectApiKeyPlaceholder = (url: string) => {
  if (url.startsWith('https://pro-api.llama.fi')) {
    const urlParts = new URL(url)
    const actualApiKey = getApiKeyValue('default')
    const keyToInject = actualApiKey || '<API-KEY>'
    const finalUrl = `${urlParts.origin}/${keyToInject}${urlParts.pathname}${urlParts.search}`
    return decodeWhitelistedCharacters(finalUrl)
  }
  return decodeWhitelistedCharacters(url)
}

/**
 * Returns a code example for given operation
 */
export const getSnippet = <T extends TargetId>(
  target: T | 'javascript',
  client: ClientId<T>,
  harRequest: HarRequest,
): ErrorResponse<string> => {
  try {
    if (!harRequest.url) {
      return [new Error('Please enter a URL to see a code snippet'), null]
    }

    harRequest.url = injectApiKeyPlaceholder(harRequest.url)

    const separator = harRequest.url.startsWith('/') ? '' : '/'

    // Hack to get around invalid URLS until we update the snippets lib
    try {
      new URL(harRequest.url)
    } catch (error) {
      console.error('[getSnippet] Invalid URL', error)
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
    // TODO: Fix this, use js (instead of javascript) everywhere
    const snippetzTargetKey = target.replace('javascript', 'js') as TargetId

    if (snippetz().hasPlugin(snippetzTargetKey, client)) {
      const payload = snippetz().print(snippetzTargetKey, client as ClientId<TargetId>, harRequest)
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
