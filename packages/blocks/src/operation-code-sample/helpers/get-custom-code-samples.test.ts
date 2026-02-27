import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getCustomCodeSamples } from './get-custom-code-samples'

describe('getCustomCodeSamples', () => {
  it('returns empty array when operation has no custom code samples', () => {
    const operation: OperationObject = {
      responses: {},
    }

    const result = getCustomCodeSamples(operation)

    expect(result).toEqual([])
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

    expect(result).toHaveLength(3)
    expect(result).toContainEqual(customExamplesSample)
    expect(result).toContainEqual(codeSamplesCamelCase)
    expect(result).toContainEqual(codeSamplesKebabCase)
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

    expect(result).toHaveLength(3)
    expect(result).toEqual([sample1, sample2, sample3])
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

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual(sample1)
    expect(result[1]).toEqual(sample2)
    expect(result[2]).toEqual(sample3)
  })
})
