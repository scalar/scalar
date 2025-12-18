import type { XCodeSample } from '@scalar/openapi-types/schemas/extensions'
import { AVAILABLE_CLIENTS } from '@scalar/snippetz'
import { describe, expect, it } from 'vitest'

import { generateClientOptions, generateCustomId } from './generate-client-options'

describe('generateClientOptions', () => {
  describe('with all clients allowed', () => {
    it('returns all available clients grouped by target', () => {
      const result = generateClientOptions(AVAILABLE_CLIENTS)

      expect(result).toHaveLength(21)
      expect(result.map((group) => group.label)).toEqual([
        'C',
        'C#',
        'Clojure',
        'Dart',
        'F#',
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
    })

    it('structures each group correctly', () => {
      const result = generateClientOptions(AVAILABLE_CLIENTS)

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

    it('returns 39 total client options', () => {
      const result = generateClientOptions(AVAILABLE_CLIENTS)
      const allOptions = result.flatMap((group) => group.options)

      expect(allOptions).toHaveLength(39)
    })
  })

  describe('with subset of clients allowed', () => {
    it('includes only allowed clients', () => {
      const result = generateClientOptions(['js/fetch', 'js/axios', 'node/fetch', 'python/requests'])

      expect(result).toHaveLength(3)
      expect(result.map((group) => group.label)).toEqual(['JavaScript', 'Node.js', 'Python'])

      const jsGroup = result.find((group) => group.label === 'JavaScript')
      expect(jsGroup?.options).toHaveLength(2)
      expect(jsGroup?.options.map((option) => option.id)).toEqual(['js/fetch', 'js/axios'])

      const nodeGroup = result.find((group) => group.label === 'Node.js')
      expect(nodeGroup?.options).toHaveLength(1)
      expect(nodeGroup?.options.map((option) => option.id)).toEqual(['node/fetch'])

      const pythonGroup = result.find((group) => group.label === 'Python')
      expect(pythonGroup?.options).toHaveLength(1)
      expect(pythonGroup?.options.map((option) => option.id)).toEqual(['python/requests'])
    })

    it('excludes clients not in the allowed list', () => {
      const result = generateClientOptions(['js/fetch', 'js/axios'])

      const jsGroup = result.find((group) => group.label === 'JavaScript')
      const clientIds = jsGroup?.options.map((option) => option.id) ?? []

      expect(clientIds).not.toContain('js/ofetch')
      expect(clientIds).not.toContain('js/jquery')
      expect(clientIds).not.toContain('js/xhr')
    })

    it('filters out groups with no allowed clients', () => {
      const result = generateClientOptions(['js/fetch', 'python/requests'])

      expect(result.map((group) => group.label)).not.toContain('Node.js')
      expect(result.map((group) => group.label)).not.toContain('Ruby')
      expect(result.map((group) => group.label)).not.toContain('Go')
    })
  })

  describe('with empty allowed list', () => {
    it('returns empty array', () => {
      const result = generateClientOptions([])

      expect(result).toEqual([])
    })
  })

  describe('curl special handling', () => {
    it('sets lang to "curl" for curl client', () => {
      const result = generateClientOptions(['shell/curl'])

      const shellGroup = result.find((group) => group.label === 'Shell')
      const curlOption = shellGroup?.options.find((option) => option.id === 'shell/curl')

      expect(curlOption?.lang).toBe('curl')
    })

    it('sets lang to group key for non-curl clients', () => {
      const result = generateClientOptions(['js/fetch'])

      const jsGroup = result.find((group) => group.label === 'JavaScript')
      const fetchOption = jsGroup?.options.find((option) => option.id === 'js/fetch')

      expect(fetchOption?.lang).toBe('js')
    })

    it('sets lang to group key for other shell clients', () => {
      const result = generateClientOptions(['shell/httpie', 'shell/wget'])

      const shellGroup = result.find((group) => group.label === 'Shell')
      const httpieOption = shellGroup?.options.find((option) => option.id === 'shell/httpie')
      const wgetOption = shellGroup?.options.find((option) => option.id === 'shell/wget')

      expect(httpieOption?.lang).toBe('shell')
      expect(wgetOption?.lang).toBe('shell')
    })
  })

  describe('option structure', () => {
    it('includes all required fields for each option', () => {
      const result = generateClientOptions(['js/fetch'])

      const jsGroup = result[0]
      expect(jsGroup).toBeDefined()
      const fetchOption = jsGroup!.options[0]

      expect(fetchOption).toHaveProperty('id')
      expect(fetchOption).toHaveProperty('lang')
      expect(fetchOption).toHaveProperty('title')
      expect(fetchOption).toHaveProperty('label')
      expect(fetchOption).toHaveProperty('targetKey')
      expect(fetchOption).toHaveProperty('targetTitle')
      expect(fetchOption).toHaveProperty('clientKey')
    })

    it('formats titles correctly', () => {
      const result = generateClientOptions(['js/fetch', 'python/requests', 'node/axios'])

      const allOptions = result.flatMap((group) => group.options)

      expect(allOptions.find((opt) => opt.id === 'js/fetch')?.title).toBe('JavaScript Fetch')
      expect(allOptions.find((opt) => opt.id === 'python/requests')?.title).toBe('Python Requests')
      expect(allOptions.find((opt) => opt.id === 'node/axios')?.title).toBe('Node.js Axios')
    })
  })

  describe('multiple clients from same target', () => {
    it('groups multiple JavaScript clients together', () => {
      const result = generateClientOptions(['js/fetch', 'js/axios', 'js/ofetch'])

      expect(result).toHaveLength(1)
      const jsGroup = result[0]
      expect(jsGroup).toBeDefined()
      expect(jsGroup!.label).toBe('JavaScript')
      expect(jsGroup!.options).toHaveLength(3)
      expect(jsGroup!.options.map((opt) => opt.id)).toEqual(['js/fetch', 'js/axios', 'js/ofetch'])
    })

    it('groups multiple Node.js clients together', () => {
      const result = generateClientOptions(['node/fetch', 'node/axios', 'node/undici', 'node/ofetch'])

      expect(result).toHaveLength(1)
      const nodeGroup = result[0]
      expect(nodeGroup).toBeDefined()
      expect(nodeGroup!.label).toBe('Node.js')
      expect(nodeGroup!.options).toHaveLength(4)
    })
  })

  describe('edge cases', () => {
    it('handles single client', () => {
      const result = generateClientOptions(['js/fetch'])

      expect(result).toHaveLength(1)
      const group = result[0]
      expect(group).toBeDefined()
      expect(group!.options).toHaveLength(1)
    })

    it('handles clients from many different targets', () => {
      const result = generateClientOptions([
        'c/libcurl',
        'go/native',
        'java/unirest',
        'python/requests',
        'ruby/native',
        'rust/reqwest',
      ])

      expect(result).toHaveLength(6)
      expect(result.map((group) => group.label)).toEqual(['C', 'Go', 'Java', 'Python', 'Ruby', 'Rust'])
    })

    it('maintains consistent ordering', () => {
      const result1 = generateClientOptions(['python/requests', 'js/fetch', 'node/axios'])
      const result2 = generateClientOptions(['node/axios', 'js/fetch', 'python/requests'])

      expect(result1.map((g) => g.label)).toEqual(result2.map((g) => g.label))
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
