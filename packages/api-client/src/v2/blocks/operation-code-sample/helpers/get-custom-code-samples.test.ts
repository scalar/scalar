import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getCustomCodeSamples } from './get-custom-code-samples'

describe('getCustomCodeSamples', () => {
  it('returns no samples when operation has no custom code samples', () => {
    const operation: OperationObject = {
      responses: {},
    }

    const result = getCustomCodeSamples(operation)

    expect(result.samples).toEqual([])
  })

  it('extracts code samples from all three custom code keys', () => {
    const customExamplesSample: XCodeSample = {
      lang: 'javascript',
      label: 'Custom Example',
      source: 'console.log("custom");',
    }

    const codeSamplesCamelCase: XCodeSample = {
      lang: 'python',
      label: 'Python Sample',
      source: 'print("hello")',
    }

    const codeSamplesKebabCase: XCodeSample = {
      lang: 'curl',
      label: 'cURL Sample',
      source: 'curl -X GET https://api.example.com',
    }

    const operation: OperationObject = {
      'x-custom-examples': [customExamplesSample],
      'x-codeSamples': [codeSamplesCamelCase],
      'x-code-samples': [codeSamplesKebabCase],
      responses: {},
    }

    const result = getCustomCodeSamples(operation)

    expect(result.samples).toHaveLength(3)
    expect(result.samples).toContainEqual(customExamplesSample)
    expect(result.samples).toContainEqual(codeSamplesCamelCase)
    expect(result.samples).toContainEqual(codeSamplesKebabCase)
  })

  it('handles multiple code samples in a single key', () => {
    const sample1: XCodeSample = {
      lang: 'javascript',
      source: 'const x = 1;',
    }

    const sample2: XCodeSample = {
      lang: 'typescript',
      label: 'TypeScript',
      source: 'const x: number = 1;',
    }

    const sample3: XCodeSample = {
      source: 'echo "hello"',
    }

    const operation: OperationObject = {
      'x-codeSamples': [sample1, sample2, sample3],
      responses: {},
    }

    const result = getCustomCodeSamples(operation)

    expect(result.samples).toHaveLength(3)
    expect(result.samples).toEqual([sample1, sample2, sample3])
  })

  it('flattens code samples from multiple keys into a single array', () => {
    const sample1: XCodeSample = {
      lang: 'go',
      source: 'fmt.Println("hello")',
    }

    const sample2: XCodeSample = {
      lang: 'rust',
      source: 'println!("hello");',
    }

    const sample3: XCodeSample = {
      lang: 'java',
      source: 'System.out.println("hello");',
    }

    const operation: OperationObject = {
      'x-custom-examples': [sample1, sample2],
      'x-code-samples': [sample3],
      responses: {},
    }

    const result = getCustomCodeSamples(operation)

    expect(result.samples).toHaveLength(3)
    expect(result.samples[0]).toEqual(sample1)
    expect(result.samples[1]).toEqual(sample2)
    expect(result.samples[2]).toEqual(sample3)
  })

  it('reads ReadMe code samples from x-readme.code-samples', () => {
    const operation: OperationObject = {
      'x-readme': {
        'code-samples': [
          { language: 'curl', name: 'Custom cURL', code: 'curl https://api.example.com' },
          { language: 'node', code: 'await client.list();' },
        ],
      },
      responses: {},
    }

    const result = getCustomCodeSamples(operation)

    expect(result.samples).toEqual([
      { lang: 'curl', label: 'Custom cURL', source: 'curl https://api.example.com' },
      { lang: 'node', source: 'await client.list();' },
    ])
  })

  it('reads Stainless snippets from x-stainless-snippets', () => {
    const operation: OperationObject = {
      'x-stainless-snippets': {
        python: 'client.accounts.list()',
        node: 'await client.accounts.list();',
      },
      responses: {},
    }

    const result = getCustomCodeSamples(operation)

    expect(result.samples).toEqual([
      { lang: 'python', source: 'client.accounts.list()' },
      { lang: 'node', source: 'await client.accounts.list();' },
    ])
  })

  it('reads Stainless examples and uses the title as the label', () => {
    const operation: OperationObject = {
      'x-stainless-examples': {
        title: 'List active accounts',
        request: {
          python: 'client.accounts.list(status="active")',
          node: "await client.accounts.list({ status: 'active' });",
        },
        response: '[{"id": "acc_123"}]',
      },
      responses: {},
    }

    const result = getCustomCodeSamples(operation)

    expect(result.samples).toEqual([
      { lang: 'python', label: 'List active accounts', source: 'client.accounts.list(status="active")' },
      { lang: 'node', label: 'List active accounts', source: "await client.accounts.list({ status: 'active' });" },
    ])
  })

  it('reads an array of Stainless examples', () => {
    const operation: OperationObject = {
      'x-stainless-examples': [
        { title: 'List', request: { python: 'client.list()' } },
        { title: 'Create', request: { python: 'client.create()' } },
      ],
      responses: {},
    }

    const result = getCustomCodeSamples(operation)

    expect(result.samples).toEqual([
      { lang: 'python', label: 'List', source: 'client.list()' },
      { lang: 'python', label: 'Create', source: 'client.create()' },
    ])
  })

  describe('priority', () => {
    it('prefers x-scalar-examples over everything else', () => {
      const operation: OperationObject = {
        'x-scalar-examples': [{ lang: 'python', source: 'scalar' }],
        'x-stainless-snippets': { python: 'snippet' },
        'x-stainless-examples': { request: { python: 'stainless' } },
        'x-readme': { 'code-samples': [{ language: 'python', code: 'readme' }] },
        'x-codeSamples': [{ lang: 'python', source: 'legacy' }],
        responses: {},
      }

      const result = getCustomCodeSamples(operation)

      expect(result.samples).toEqual([{ lang: 'python', source: 'scalar' }])
    })

    it('prefers x-stainless-snippets over x-stainless-examples', () => {
      const operation: OperationObject = {
        'x-stainless-snippets': { python: 'snippet' },
        'x-stainless-examples': { request: { python: 'stainless' } },
        responses: {},
      }

      const result = getCustomCodeSamples(operation)

      expect(result.samples).toEqual([{ lang: 'python', source: 'snippet' }])
    })

    it('prefers x-readme over the legacy x-codeSamples family', () => {
      const operation: OperationObject = {
        'x-readme': { 'code-samples': [{ language: 'python', code: 'readme' }] },
        'x-codeSamples': [{ lang: 'python', source: 'legacy' }],
        responses: {},
      }

      const result = getCustomCodeSamples(operation)

      expect(result.samples).toEqual([{ lang: 'python', source: 'readme' }])
    })

    it('falls back to the legacy x-codeSamples family when no other extension is present', () => {
      const operation: OperationObject = {
        'x-codeSamples': [{ lang: 'python', source: 'legacy' }],
        responses: {},
      }

      const result = getCustomCodeSamples(operation)

      expect(result.samples).toEqual([{ lang: 'python', source: 'legacy' }])
    })
  })

  describe('group label', () => {
    it('labels x-scalar-examples as "SDK"', () => {
      const operation: OperationObject = {
        'x-scalar-examples': [{ lang: 'python', source: 'scalar' }],
        responses: {},
      }

      expect(getCustomCodeSamples(operation).label).toBe('SDK')
    })

    it('labels x-stainless-snippets as "SDK"', () => {
      const operation: OperationObject = {
        'x-stainless-snippets': { python: 'client.list()' },
        responses: {},
      }

      expect(getCustomCodeSamples(operation).label).toBe('SDK')
    })

    it('labels x-stainless-examples as "SDK"', () => {
      const operation: OperationObject = {
        'x-stainless-examples': { request: { python: 'client.list()' } },
        responses: {},
      }

      expect(getCustomCodeSamples(operation).label).toBe('SDK')
    })

    it('labels x-readme samples as "Code Examples"', () => {
      const operation: OperationObject = {
        'x-readme': { 'code-samples': [{ language: 'python', code: 'readme' }] },
        responses: {},
      }

      expect(getCustomCodeSamples(operation).label).toBe('Code Examples')
    })

    it('labels the legacy x-codeSamples family as "Code Examples"', () => {
      const operation: OperationObject = {
        'x-codeSamples': [{ lang: 'python', source: 'legacy' }],
        responses: {},
      }

      expect(getCustomCodeSamples(operation).label).toBe('Code Examples')
    })

    it('falls back to "Code Examples" when no custom samples are present', () => {
      const operation: OperationObject = {
        responses: {},
      }

      expect(getCustomCodeSamples(operation).label).toBe('Code Examples')
    })
  })
})
