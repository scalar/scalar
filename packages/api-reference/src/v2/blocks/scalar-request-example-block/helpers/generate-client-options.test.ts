import { describe, expect, it } from 'vitest'
import { generateClientOptions, generateCustomId } from './generate-client-options'
import type { XCodeSample } from '@scalar/openapi-types/schemas/extensions'

describe('generateClientOptions', () => {
  describe('when hiddenClients is true', () => {
    it('should return an empty array', () => {
      const result = generateClientOptions(true)
      expect(result).toEqual([])
    })
  })

  describe('when hiddenClients is undefined', () => {
    it('should return all available clients', () => {
      const result = generateClientOptions(undefined)

      expect(result).toHaveLength(20)
      // Test the group labels
      expect(result.map((group) => group.label)).toEqual([
        'C',
        'C#',
        'Clojure',
        'Dart',
        'Go',
        'HTTP',
        'Java',
        'JavaScript',
        'Kotlin',
        'Node.js',
        'Objective-C',
        'OCaml',
        'PHP',
        'PowerShell',
        'Python',
        'R',
        'Ruby',
        'Rust',
        'Shell',
        'Swift',
      ])
      // Test the first group structure
      expect(result[0]).toEqual({
        label: 'C',
        options: [
          {
            id: 'c/libcurl',
            lang: 'c',
            title: 'C Libcurl',
            label: 'Libcurl',
            clientKey: 'libcurl',
            targetKey: 'c',
            targetTitle: 'C',
          },
        ],
      })
    })
  })

  describe('when hiddenClients is an array', () => {
    it('should hide specific clients across all categories', () => {
      const results = generateClientOptions(['fetch', 'axios'])

      // Check that fetch and axios are hidden from node and js groups
      expect(results.find((group) => group.label === 'JavaScript')?.options).toStrictEqual([
        {
          id: 'js/ofetch',
          lang: 'js',
          title: 'JavaScript ofetch',
          label: 'ofetch',
          clientKey: 'ofetch',
          targetKey: 'js',
          targetTitle: 'JavaScript',
        },
        {
          id: 'js/jquery',
          lang: 'js',
          title: 'JavaScript jQuery',
          label: 'jQuery',
          clientKey: 'jquery',
          targetKey: 'js',
          targetTitle: 'JavaScript',
        },
        {
          id: 'js/xhr',
          lang: 'js',
          title: 'JavaScript XHR',
          label: 'XHR',
          clientKey: 'xhr',
          targetKey: 'js',
          targetTitle: 'JavaScript',
        },
      ])
      expect(results.find((group) => group.label === 'Node.js')?.options).toStrictEqual([
        {
          id: 'node/ofetch',
          lang: 'node',
          title: 'Node.js ofetch',
          label: 'ofetch',
          clientKey: 'ofetch',
          targetKey: 'node',
          targetTitle: 'Node.js',
        },
        {
          id: 'node/undici',
          lang: 'node',
          title: 'Node.js undici',
          label: 'undici',
          clientKey: 'undici',
          targetKey: 'node',
          targetTitle: 'Node.js',
        },
      ])
    })

    it('should handle empty array (show all clients)', () => {
      expect(generateClientOptions([])).toStrictEqual(generateClientOptions(undefined))
    })
  })

  describe('when hiddenClients is an object', () => {
    it('should hide entire categories when value is true', () => {
      const result = generateClientOptions({ js: true, python: true })

      expect(result).toHaveLength(18) // 20 - 2 hidden groups
      expect(result.map((group) => group.label)).not.toContain('JavaScript')
      expect(result.map((group) => group.label)).not.toContain('Python')
    })

    it('should hide specific clients within categories', () => {
      const result = generateClientOptions({
        js: ['fetch', 'axios'],
        node: ['undici'],
      })

      // Check js group - only jquery, ofetch, and xhr should remain
      const jsGroup = result.find((group) => group.label === 'JavaScript')
      expect(jsGroup?.options).toHaveLength(3)
      expect(jsGroup?.options.map((option) => option.id)).toEqual(['js/ofetch', 'js/jquery', 'js/xhr'])

      // Check node group - fetch, axios, and ofetch should remain, undici should be hidden
      const nodeGroup = result.find((group) => group.label === 'Node.js')
      expect(nodeGroup?.options).toHaveLength(3)
      expect(nodeGroup?.options.map((option) => option.id)).toEqual(['node/fetch', 'node/axios', 'node/ofetch'])
    })

    it('should handle mixed boolean and array values', () => {
      const result = generateClientOptions({
        js: true, // Hide entire js category
        node: ['fetch'], // Hide only fetch from node
        python: ['requests'], // Hide only requests from python
      })

      expect(result).toHaveLength(19) // js is completely hidden
      expect(result.map((group) => group.label)).not.toContain('JavaScript')

      // Check node group - axios, ofetch, and undici should remain
      const nodeGroup = result.find((group) => group.label === 'Node.js')
      expect(nodeGroup?.options).toHaveLength(3)
      expect(nodeGroup?.options.map((option) => option.id)).toEqual(['node/axios', 'node/ofetch', 'node/undici'])

      // Check python group - python3, httpx_sync, and httpx_async should remain
      const pythonGroup = result.find((group) => group.label === 'Python')
      expect(pythonGroup?.options).toHaveLength(3)
      expect(pythonGroup?.options.map((option) => option.id)).toEqual([
        'python/python3',
        'python/httpx_sync',
        'python/httpx_async',
      ])
    })

    it('should handle empty object (show all clients)', () => {
      const result = generateClientOptions({})

      expect(result).toHaveLength(20)
      const allOptions = result.flatMap((group) => group.options)
      expect(allOptions).toHaveLength(38) // All clients should be present
    })
  })

  describe('edge cases', () => {
    it('should handle non-existent client names in arrays', () => {
      const result = generateClientOptions(['nonexistent', 'also-nonexistent'])

      expect(result).toHaveLength(20)
      const allOptions = result.flatMap((group) => group.options)
      expect(allOptions).toHaveLength(38) // All clients should still be present
    })

    it('should handle non-existent category names in objects', () => {
      const result = generateClientOptions({
        nonexistent: true,
        alsoNonexistent: ['fetch'],
      })

      expect(result).toHaveLength(20)
      const allOptions = result.flatMap((group) => group.options)
      expect(allOptions).toHaveLength(38) // All clients should still be present
    })

    it('should handle non-existent client names in object arrays', () => {
      const result = generateClientOptions({
        js: ['nonexistent', 'fetch'],
        node: ['also-nonexistent'],
      })

      // fetch should be hidden from js, but other clients should remain
      const jsGroup = result.find((group) => group.label === 'JavaScript')
      expect(jsGroup?.options).toHaveLength(4) // axios, ofetch, jquery, xhr should remain
      expect(jsGroup?.options.map((option) => option.id)).toEqual(['js/axios', 'js/ofetch', 'js/jquery', 'js/xhr'])

      // node group should be unchanged since the client doesn't exist
      const nodeGroup = result.find((group) => group.label === 'Node.js')
      expect(nodeGroup?.options).toHaveLength(4) // All node clients should remain
    })
  })

  describe('curl special handling', () => {
    it('should set lang to "curl" for curl client', () => {
      const result = generateClientOptions(undefined)

      const shellGroup = result.find((group) => group.label === 'Shell')
      const curlOption = shellGroup?.options.find((option) => option.id === 'shell/curl')

      expect(curlOption?.lang).toBe('curl')
    })

    it('should set lang to group key for non-curl clients', () => {
      const result = generateClientOptions(undefined)

      const jsGroup = result.find((group) => group.label === 'JavaScript')
      const fetchOption = jsGroup?.options.find((option) => option.id === 'js/fetch')

      expect(fetchOption?.lang).toBe('js')
    })
  })

  describe('group filtering', () => {
    it('should remove groups that have no visible clients', () => {
      const result = generateClientOptions({
        js: ['fetch', 'axios', 'ofetch', 'jquery', 'xhr'], // Hide all js clients
      })

      expect(result).toHaveLength(19) // js group should be removed
      expect(result.map((group) => group.label)).not.toContain('JavaScript')
    })

    it('should keep groups that have at least one visible client', () => {
      const result = generateClientOptions({
        js: ['fetch', 'axios'], // Hide only fetch and axios, keep ofetch, jquery, xhr
      })

      expect(result).toHaveLength(20) // All groups should remain
      const jsGroup = result.find((group) => group.label === 'JavaScript')
      expect(jsGroup?.options).toHaveLength(3) // Only ofetch, jquery, xhr should remain
    })
  })
})

describe('generateCustomId', () => {
  it('should generate correct custom ID for code samples', () => {
    const sample: XCodeSample = {
      lang: 'typescript',
      label: 'TypeScript Example',
      source: 'console.log("Hello World")',
    }

    const result = generateCustomId(sample)
    expect(result).toBe('custom/typescript')
  })

  it('should handle different language types', () => {
    const samples: XCodeSample[] = [
      { lang: 'javascript', source: 'console.log("test")' },
      { lang: 'python', source: 'print("test")' },
      { lang: 'curl', source: 'curl -X GET https://api.example.com' },
    ]

    const results = samples.map((sample) => generateCustomId(sample))
    expect(results).toEqual(['custom/javascript', 'custom/python', 'custom/curl'])
  })
})
