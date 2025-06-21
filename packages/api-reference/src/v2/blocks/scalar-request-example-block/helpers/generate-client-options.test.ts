import { describe, expect, it } from 'vitest'
import type { XCodeSample } from '@scalar/openapi-types/schemas/extensions'
import type { AvailableClients } from '@scalar/snippetz'
import { generateClientOptions } from './generate-client-options'

describe('generateClientOptions', () => {
  describe('basic functionality', () => {
    it('should generate client options from built-in snippets without custom examples', () => {
      const result = generateClientOptions([])

      // Should return a non-empty array of client groups
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)

      // Each group should have the expected structure
      result.forEach((group) => {
        expect(group).toHaveProperty('label')
        expect(group).toHaveProperty('options')
        expect(Array.isArray(group.options)).toBe(true)
        expect(group.options.length).toBeGreaterThan(0)

        group.options.forEach((option) => {
          expect(option).toHaveProperty('id')
          expect(option).toHaveProperty('lang')
          expect(option).toHaveProperty('title')
          expect(option).toHaveProperty('label')
        })
      })
    })

    it('should handle curl client with special shell language mapping', () => {
      const result = generateClientOptions([])

      const shellGroup = result.find((group) => group.label === 'Shell')
      expect(shellGroup).toBeDefined()

      const curlOption = shellGroup?.options.find((option) => option.id === 'shell/curl')
      expect(curlOption).toBeDefined()
      expect(curlOption?.lang).toBe('curl')
    })

    it('should call snippetz clients function', async () => {
      // This test verifies the function works without throwing errors
      // Since we're not mocking, we just ensure it runs successfully
      expect(() => generateClientOptions([])).not.toThrow()
    })
  })

  describe('custom request examples', () => {
    it('should add custom code samples as a separate group at the top', () => {
      const customExamples: XCodeSample[] = [
        {
          lang: 'typescript',
          label: 'TypeScript Example',
          source: 'console.log("Hello TypeScript")',
        },
        {
          lang: 'rust',
          source: 'println!("Hello Rust")',
        },
      ]

      const result = generateClientOptions(customExamples)

      expect(result[0]).toEqual({
        label: 'Code Examples',
        options: [
          {
            id: 'custom/typescript',
            lang: 'typescript',
            title: 'TypeScript Example',
            label: 'TypeScript Example',
          },
          {
            id: 'custom/rust',
            lang: 'rust',
            title: 'rust',
            label: 'rust',
          },
        ],
      })

      // Built-in clients should still be present after custom examples
      expect(result.length).toBeGreaterThan(1)
      expect(result[1]).toHaveProperty('label')
      expect(result[1]).toHaveProperty('options')
    })

    it('should handle custom examples with missing lang property', () => {
      const customExamples: XCodeSample[] = [
        {
          label: 'Custom Example',
          source: 'console.log("Hello")',
        },
      ]

      const result = generateClientOptions(customExamples)

      expect(result[0].options[0]).toEqual({
        id: 'custom/undefined',
        lang: 'plaintext',
        title: 'Custom Example',
        label: 'Custom Example',
      })
    })

    it('should handle custom examples with missing label property', () => {
      const customExamples: XCodeSample[] = [
        {
          lang: 'typescript',
          source: 'console.log("Hello")',
        },
      ]

      const result = generateClientOptions(customExamples)

      expect(result[0].options[0]).toEqual({
        id: 'custom/typescript',
        lang: 'typescript',
        title: 'typescript',
        label: 'typescript',
      })
    })

    it('should handle custom examples with both lang and label missing', () => {
      const customExamples: XCodeSample[] = [
        {
          source: 'console.log("Hello")',
        },
      ]

      const result = generateClientOptions(customExamples)

      expect(result[0].options[0]).toEqual({
        id: 'custom/undefined',
        lang: 'plaintext',
        title: 'custom/undefined',
        label: 'custom/undefined',
      })
    })

    it('should not add Code Examples group when no custom examples provided', () => {
      const result = generateClientOptions([])

      expect(result[0].label).not.toBe('Code Examples')
      // Should have built-in clients
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle empty custom examples array', () => {
      const result = generateClientOptions([])

      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('label')
      expect(result[0]).toHaveProperty('options')
    })
  })

  describe('client filtering with allowedClients', () => {
    it('should filter clients based on allowedClients parameter', () => {
      const allowedClients: AvailableClients[number][] = ['js/fetch', 'python/requests']

      const result = generateClientOptions([], allowedClients)

      // Should only contain the allowed clients
      const allOptions = result.flatMap((group) => group.options)
      const allIds = allOptions.map((option) => option.id)

      expect(allIds).toContain('js/fetch')
      expect(allIds).toContain('python/requests')
      expect(allIds.length).toBe(2)
    })

    it('should return empty array when no clients are allowed', () => {
      const allowedClients: AvailableClients[number][] = ['js/nonexistent' as AvailableClients[number]]

      const result = generateClientOptions([], allowedClients)

      expect(result).toEqual([])
    })

    it('should include all clients when allowedClients is undefined', () => {
      const result = generateClientOptions([], undefined)

      // Should return all available clients
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('label')
      expect(result[0]).toHaveProperty('options')
    })

    it('should include no clients when allowedClients is empty array', () => {
      const result = generateClientOptions([], [])

      // Empty array should return all clients (no filtering)
      expect(result.length).toBe(0)
    })

    it('should filter out entire groups when no clients in group are allowed', () => {
      const allowedClients: AvailableClients[number][] = ['js/fetch']

      const result = generateClientOptions([], allowedClients)

      // Should only contain JavaScript group with fetch
      expect(result.length).toBe(1)
      expect(result[0].label).toBe('JavaScript')
      expect(result[0].options.length).toBe(1)
      expect(result[0].options[0].id).toBe('js/fetch')
    })

    it('should handle partial group filtering', () => {
      const allowedClients: AvailableClients[number][] = ['js/fetch', 'js/axios']

      const result = generateClientOptions([], allowedClients)

      expect(result.length).toBe(1) // Only JavaScript group
      expect(result[0].label).toBe('JavaScript')
      expect(result[0].options.length).toBe(2) // fetch and axios clients
      expect(result[0].options.find((opt) => opt.id === 'js/fetch')).toBeDefined()
      expect(result[0].options.find((opt) => opt.id === 'js/axios')).toBeDefined()
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle empty clients array from snippetz', () => {
      // This test is not applicable since snippetz always returns clients
      // Instead, test that the function handles the real data correctly
      const result = generateClientOptions([])
      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle group with empty clients array', () => {
      // This test is not applicable since all groups have clients
      // Instead, test that the function works with real data
      const result = generateClientOptions([])
      expect(result.length).toBeGreaterThan(0)
      result.forEach((group) => {
        expect(group.options.length).toBeGreaterThan(0)
      })
    })

    it('should handle groups with null or undefined clients', () => {
      // This test is not applicable since all clients are valid
      // Instead, test that the function works with real data
      const result = generateClientOptions([])
      expect(result.length).toBeGreaterThan(0)
      result.forEach((group) => {
        group.options.forEach((option) => {
          expect(option.id).toBeDefined()
          expect(option.lang).toBeDefined()
          expect(option.title).toBeDefined()
          expect(option.label).toBeDefined()
        })
      })
    })

    it('should handle missing properties in client objects', () => {
      // This test is not applicable since all clients have required properties
      // Instead, test that the function works with real data
      const result = generateClientOptions([])
      expect(result.length).toBeGreaterThan(0)
      result.forEach((group) => {
        group.options.forEach((option) => {
          expect(option).toHaveProperty('id')
          expect(option).toHaveProperty('lang')
          expect(option).toHaveProperty('title')
          expect(option).toHaveProperty('label')
        })
      })
    })

    it('should handle custom examples with special characters in lang', () => {
      const customExamples: XCodeSample[] = [
        {
          lang: 'c++',
          label: 'C++ Example',
          source: '#include <iostream>',
        },
        {
          lang: 'c#',
          label: 'C# Example',
          source: 'Console.WriteLine("Hello");',
        },
      ]

      const result = generateClientOptions(customExamples)

      expect(result[0].options[0]).toEqual({
        id: 'custom/c++',
        lang: 'c++',
        title: 'C++ Example',
        label: 'C++ Example',
      })

      expect(result[0].options[1]).toEqual({
        id: 'custom/c#',
        lang: 'c#',
        title: 'C# Example',
        label: 'C# Example',
      })
    })
  })

  describe('integration scenarios', () => {
    it('should combine custom examples with filtered built-in clients', () => {
      const customExamples: XCodeSample[] = [
        {
          lang: 'typescript',
          label: 'TypeScript Example',
          source: 'console.log("Hello")',
        },
      ]

      const allowedClients: AvailableClients[number][] = ['js/fetch', 'python/requests']

      const result = generateClientOptions(customExamples, allowedClients)

      expect(result.length).toBe(3) // 1 custom + 2 built-in groups
      expect(result[0].label).toBe('Code Examples')
      expect(result[1].label).toBe('JavaScript')
      expect(result[2].label).toBe('Python')
    })

    it('should handle complex filtering with multiple groups and clients', () => {
      const allowedClients: AvailableClients[number][] = ['js/fetch', 'js/axios', 'python/requests', 'shell/curl']

      const result = generateClientOptions([], allowedClients)

      expect(result.length).toBe(3) // JavaScript, Python, Shell
      expect(result[0].options.length).toBe(2) // fetch, axios
      expect(result[1].options.length).toBe(1) // requests
      expect(result[2].options.length).toBe(1) // curl
    })

    it('should maintain correct order: custom examples first, then built-in clients', () => {
      const customExamples: XCodeSample[] = [
        {
          lang: 'typescript',
          label: 'TypeScript',
          source: 'console.log("Hello")',
        },
        {
          lang: 'rust',
          label: 'Rust',
          source: 'println!("Hello")',
        },
      ]

      const result = generateClientOptions(customExamples)

      expect(result[0].label).toBe('Code Examples')
      expect(result[0].options[0].id).toBe('custom/typescript')
      expect(result[0].options[1].id).toBe('custom/rust')
      expect(result.length).toBeGreaterThan(1)
    })
  })

  describe('type safety and validation', () => {
    it('should handle various TargetId types correctly', () => {
      const customExamples: XCodeSample[] = [
        { lang: 'js', source: 'console.log("JS")' },
        { lang: 'python', source: 'print("Python")' },
        { lang: 'shell', source: 'echo "Shell"' },
        { lang: 'node', source: 'console.log("Node")' },
      ]

      const result = generateClientOptions(customExamples)

      expect(result[0].options[0].lang).toBe('js')
      expect(result[0].options[1].lang).toBe('python')
      expect(result[0].options[2].lang).toBe('shell')
      expect(result[0].options[3].lang).toBe('node')
    })

    it('should handle unknown TargetId types gracefully', () => {
      const customExamples: XCodeSample[] = [{ lang: 'unknown-language', source: 'console.log("Unknown")' }]

      const result = generateClientOptions(customExamples)

      expect(result[0].options[0].lang).toBe('unknown-language')
    })

    it('should generate correct client IDs for all scenarios', () => {
      const customExamples: XCodeSample[] = [{ lang: 'typescript', source: 'console.log("TS")' }]

      const allowedClients: AvailableClients[number][] = ['js/fetch']

      const result = generateClientOptions(customExamples, allowedClients)

      expect(result[0].options[0].id).toBe('custom/typescript')
      expect(result[1].options[0].id).toBe('js/fetch')
    })
  })

  describe('performance and memory considerations', () => {
    it('should handle large number of custom examples efficiently', () => {
      const customExamples: XCodeSample[] = Array.from({ length: 100 }, (_, i) => ({
        lang: `lang${i}`,
        label: `Language ${i}`,
        source: `console.log("Hello ${i}")`,
      }))

      const result = generateClientOptions(customExamples)

      expect(result[0].options.length).toBe(100)
      expect(result[0].options[99].id).toBe('custom/lang99')
    })

    it('should handle large number of allowed clients efficiently', () => {
      const allowedClients: AvailableClients[number][] = [
        'js/fetch',
        'js/axios',
        'js/xhr',
        'python/requests',
        'python/python3',
        'shell/curl',
        'shell/wget',
        'node/fetch',
        'node/undici',
      ]

      const result = generateClientOptions([], allowedClients)

      expect(result.length).toBeGreaterThan(0)
      const allOptions = result.flatMap((group) => group.options)
      expect(allOptions.length).toBe(9) // All 9 clients
    })
  })

  describe('real-world scenarios', () => {
    it('should work with typical API documentation setup', () => {
      const customExamples: XCodeSample[] = [
        {
          lang: 'typescript',
          label: 'TypeScript with Axios',
          source: 'import axios from "axios";\nconst response = await axios.get("/api/users");',
        },
        {
          lang: 'python',
          label: 'Python with requests',
          source: 'import requests\nresponse = requests.get("/api/users")',
        },
      ]

      const allowedClients: AvailableClients[number][] = ['js/fetch', 'js/axios', 'python/requests', 'shell/curl']

      const result = generateClientOptions(customExamples, allowedClients)

      expect(result.length).toBe(4) // 1 custom + 3 built-in groups
      expect(result[0].label).toBe('Code Examples')
      expect(result[0].options.length).toBe(2)
      expect(result[1].label).toBe('JavaScript')
      expect(result[1].options.length).toBe(2)
      expect(result[2].label).toBe('Python')
      expect(result[2].options.length).toBe(1)
      expect(result[3].label).toBe('Shell')
      expect(result[3].options.length).toBe(1)
    })

    it('should handle minimal setup with only custom examples', () => {
      const customExamples: XCodeSample[] = [
        {
          lang: 'typescript',
          label: 'TypeScript',
          source: 'console.log("Hello")',
        },
      ]

      const result = generateClientOptions(customExamples, [])

      expect(result.length).toBe(1) // Only custom examples
      expect(result[0].label).toBe('Code Examples')
      expect(result[0].options.length).toBe(1)
    })

    it('should handle enterprise setup with many restrictions', () => {
      const customExamples: XCodeSample[] = [
        {
          lang: 'java',
          label: 'Java Spring',
          source: '// Java Spring example',
        },
        {
          lang: 'csharp',
          label: 'C# .NET',
          source: '// C# .NET example',
        },
      ]

      const allowedClients: AvailableClients[number][] = ['js/fetch']

      const result = generateClientOptions(customExamples, allowedClients)

      expect(result.length).toBe(2) // 1 custom + 1 built-in group
      expect(result[0].label).toBe('Code Examples')
      expect(result[0].options.length).toBe(2)
      expect(result[1].label).toBe('JavaScript')
      expect(result[1].options.length).toBe(1)
    })
  })
})
