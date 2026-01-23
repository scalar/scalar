import { AVAILABLE_CLIENTS } from '@scalar/types/snippetz'
import { describe, expect, it } from 'vitest'

import { mapHiddenClientsConfig } from './map-hidden-clients-config'

describe('mapHiddenClientsConfig', () => {
  /**
   * Array format - hiding specific clients by their full identifiers
   * This is the most straightforward case where users list exact client IDs to hide.
   */
  it('filters out specific clients when hiddenClients is an array', () => {
    const hiddenClients = ['js/fetch', 'js/axios', 'java/unirest']
    const result = mapHiddenClientsConfig(hiddenClients)

    // Should not include the hidden clients
    expect(result).not.toContain('js/fetch')
    expect(result).not.toContain('js/axios')
    expect(result).not.toContain('java/unirest')

    // Should still include other clients
    expect(result).toContain('node/fetch')
    expect(result).toContain('python/requests')
    expect(result).toContain('shell/curl')

    // Should have fewer clients than the original list
    expect(result.length).toBe(AVAILABLE_CLIENTS.length - 3)
  })

  /** Array format - hiding cross language clients */
  it('filters out groups of clients when hiddenClients is an array', () => {
    const hiddenClients = ['fetch', 'axios', 'ruby']
    const result = mapHiddenClientsConfig(hiddenClients)

    // Should not include the hidden clients
    expect(result).not.toContain('js/axios')
    expect(result).not.toContain('js/fetch')
    expect(result).not.toContain('node/fetch')
    expect(result).not.toContain('node/axios')
  })

  /** Array format - hiding whole groups */
  it('filters out groups of clients when hiddenClients is an array', () => {
    const hiddenClients = ['js', 'java', 'ruby']
    const result = mapHiddenClientsConfig(hiddenClients)

    // Should not include the hidden clients
    expect(result).not.toContain('js/axios')
    expect(result).not.toContain('js/fetch')
    expect(result).not.toContain('js/jquery')
    expect(result).not.toContain('js/ofetch')
    expect(result).not.toContain('js/xhr')
    expect(result).not.toContain('java/asynchttp')
    expect(result).not.toContain('java/nethttp')
    expect(result).not.toContain('java/okhttp')
    expect(result).not.toContain('java/unirest')
    expect(result).not.toContain('ruby/native')

    // Should still include other clients
    expect(result).toContain('node/fetch')
    expect(result).toContain('python/requests')
    expect(result).toContain('shell/curl')

    // Should have fewer clients than the original list
    expect(result.length).toBe(AVAILABLE_CLIENTS.length - 10)
  })

  /**
   * Object format with boolean true - hiding entire target languages
   * When a target is set to true, all clients for that language should be hidden.
   */
  it('filters out entire target languages when hiddenClients object has boolean true values', () => {
    const hiddenClients = { node: true, python: true }
    const result = mapHiddenClientsConfig(hiddenClients)

    // Should not include any node clients
    expect(result).not.toContain('node/fetch')
    expect(result).not.toContain('node/axios')
    expect(result).not.toContain('node/ofetch')
    expect(result).not.toContain('node/undici')

    // Should not include any python clients
    expect(result).not.toContain('python/python3')
    expect(result).not.toContain('python/requests')
    expect(result).not.toContain('python/httpx_sync')
    expect(result).not.toContain('python/httpx_async')

    // Should still include other language clients
    expect(result).toContain('js/fetch')
    expect(result).toContain('shell/curl')
    expect(result).toContain('java/unirest')
  })

  /**
   * Object format with array values - hiding specific clients within a target
   * This allows fine-grained control to hide only certain clients of a language.
   */
  it('filters out specific clients within a target when hiddenClients object has array values', () => {
    const hiddenClients = { python: ['requests', 'httpx_async'], java: ['unirest'] }
    const result = mapHiddenClientsConfig(hiddenClients)

    // Should not include the specified python clients
    expect(result).not.toContain('python/requests')
    expect(result).not.toContain('python/httpx_async')

    // Should still include other python clients
    expect(result).toContain('python/python3')
    expect(result).toContain('python/httpx_sync')

    // Should not include the specified java client
    expect(result).not.toContain('java/unirest')

    // Should still include other java clients
    expect(result).toContain('java/asynchttp')
    expect(result).toContain('java/nethttp')
    expect(result).toContain('java/okhttp')
  })

  /**
   * Mixed object format - combining boolean and array values
   * This tests the most complex scenario where some languages are fully hidden
   * and others have only specific clients hidden.
   */
  it('handles mixed object format with both boolean and array values', () => {
    const hiddenClients = {
      node: true, // Hide all node clients
      python: ['requests'], // Hide only python requests
      js: ['axios', 'jquery'], // Hide specific js clients
    }
    const result = mapHiddenClientsConfig(hiddenClients)

    // Should not include any node clients (boolean true)
    expect(result).not.toContain('node/fetch')
    expect(result).not.toContain('node/axios')
    expect(result).not.toContain('node/ofetch')
    expect(result).not.toContain('node/undici')

    // Should not include python requests but keep others
    expect(result).not.toContain('python/requests')
    expect(result).toContain('python/python3')
    expect(result).toContain('python/httpx_sync')

    // Should not include specified js clients but keep others
    expect(result).not.toContain('js/axios')
    expect(result).not.toContain('js/jquery')
    expect(result).toContain('js/fetch')
    expect(result).toContain('js/ofetch')
    expect(result).toContain('js/xhr')
  })

  /**
   * Boolean true - hiding all clients
   * This is the nuclear option where the user wants to hide all code samples.
   */
  it('returns empty array when hiddenClients is true', () => {
    const result = mapHiddenClientsConfig(true)

    expect(result).toEqual([])
    expect(result.length).toBe(0)
  })

  /**
   *  Undefined, null, false or [] - showing all clients
   * These are the default cases where no filtering should occur.
   */
  it('returns all available clients when hiddenClients is undefined, null, false or an empty array', () => {
    const undefinedResult = mapHiddenClientsConfig(undefined)
    expect(undefinedResult).toEqual(AVAILABLE_CLIENTS)
    expect(undefinedResult.length).toBe(AVAILABLE_CLIENTS.length)

    // @ts-expect-error - Testing null case even though type does not allow it
    const nullResult = mapHiddenClientsConfig(null)
    expect(nullResult).toEqual(AVAILABLE_CLIENTS)

    // @ts-expect-error - Testing false case even though type does not allow it
    const falseResult = mapHiddenClientsConfig(false)
    expect(falseResult).toEqual(AVAILABLE_CLIENTS)

    const emptyArrayResult = mapHiddenClientsConfig([])
    expect(emptyArrayResult).toEqual(AVAILABLE_CLIENTS)
  })
})
