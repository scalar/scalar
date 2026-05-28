import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import { describe, expect, it } from 'vitest'

import type { ClientOptionGroup, CustomClientOption } from '@/v2/blocks/operation-code-sample'

import { getClients } from './get-clients'

describe('getClients', () => {
  /**
   * Test 1: Verifies that custom code samples are properly transformed and grouped by language
   * This is critical because it ensures custom examples appear first in the UI,
   * are correctly structured with all required properties, and are grouped by language.
   */
  it('groups custom code samples by language and prepends them', () => {
    const customCodeSamples: XCodeSample[] = [
      {
        lang: 'python',
        label: 'Custom Python Example',
        source: 'print("Hello World")',
      },
      {
        lang: 'js',
        label: 'Custom JS Example',
        source: 'console.log("Hello World")',
      },
    ]

    const clientOptions: ClientOptionGroup[] = [
      {
        label: 'Shell',
        key: 'shell',
        options: [
          {
            id: 'shell/curl',
            lang: 'curl',
            title: 'Shell cURL',
            label: 'cURL',
            targetKey: 'shell',
            targetTitle: 'Shell',
            clientKey: 'curl',
          },
        ],
      },
    ]

    const result = getClients(customCodeSamples, clientOptions)

    // Should have language groups + original client options
    expect(result).toHaveLength(3)

    // First group should be Python (first language encountered)
    expect(result[0]).toEqual({
      label: 'Python',
      key: 'custom-python',
      options: [
        {
          id: 'custom/0',
          lang: 'python',
          clientKey: 'custom',
          title: 'Custom Python Example',
          label: 'Custom Python Example',
        },
      ] satisfies CustomClientOption[],
    })

    // Second group should be Js (capitalized)
    expect(result[1]).toEqual({
      label: 'Js',
      key: 'custom-js',
      options: [
        {
          id: 'custom/1',
          lang: 'js',
          clientKey: 'custom',
          title: 'Custom JS Example',
          label: 'Custom JS Example',
        },
      ] satisfies CustomClientOption[],
    })

    // Original client options should follow
    expect(result[2]).toEqual(clientOptions[0])
  })

  /**
   * Test 2: Verifies fallback behavior when optional fields are missing
   * This is critical because the OpenAPI spec allows lang and label to be optional,
   * and we need to handle these cases gracefully without breaking the UI.
   */
  it('handles custom code samples with missing lang and label fields', () => {
    const customCodeSamples: XCodeSample[] = [
      {
        source: 'echo "test"',
      },
      {
        lang: 'ruby',
        source: 'puts "test"',
      },
      {
        label: 'Special Example',
        source: 'special code',
      },
    ]

    const clientOptions: ClientOptionGroup[] = []

    const result = getClients(customCodeSamples, clientOptions)

    // Should have 2 groups: plaintext (samples 0 and 2) and ruby (sample 1)
    expect(result).toHaveLength(2)

    // First group is plaintext (first sample without lang defaults to plaintext)
    const plaintextGroup = result[0]
    expect(plaintextGroup).toBeDefined()
    expect(plaintextGroup?.label).toBe('Plaintext')
    expect(plaintextGroup?.key).toBe('custom-plaintext')
    expect(plaintextGroup?.options).toHaveLength(2)

    // When both lang and label are missing, should use the generated ID as label
    expect(plaintextGroup?.options[0]).toMatchObject({
      id: 'custom/0',
      lang: 'plaintext',
      title: 'custom/0',
      label: 'custom/0',
    })

    // When lang is missing, should use label and default to plaintext
    expect(plaintextGroup?.options[1]).toMatchObject({
      id: 'custom/2',
      lang: 'plaintext',
      title: 'Special Example',
      label: 'Special Example',
    })

    // Second group is ruby
    const rubyGroup = result[1]
    expect(rubyGroup).toBeDefined()
    expect(rubyGroup?.label).toBe('Ruby')
    expect(rubyGroup?.key).toBe('custom-ruby')
    expect(rubyGroup?.options).toHaveLength(1)

    // When label is missing, should use lang
    expect(rubyGroup?.options[0]).toMatchObject({
      id: 'custom/1',
      lang: 'ruby',
      title: 'ruby',
      label: 'ruby',
    })
  })

  /**
   * Test 3: Verifies that the function returns client options unchanged when no custom samples exist
   * This is critical because it ensures the function does not mutate or modify the original
   * client options when there is nothing to merge, maintaining referential integrity.
   */
  it('should return original client options unchanged when custom code samples array is empty', () => {
    const customCodeSamples: XCodeSample[] = []

    const clientOptions: ClientOptionGroup[] = [
      {
        label: 'JavaScript',
        key: 'js',
        options: [
          {
            id: 'js/fetch',
            lang: 'js',
            title: 'JavaScript Fetch',
            label: 'Fetch',
            targetKey: 'js',
            targetTitle: 'JavaScript',
            clientKey: 'fetch',
          },
          {
            id: 'js/axios',
            lang: 'js',
            title: 'JavaScript Axios',
            label: 'Axios',
            targetKey: 'js',
            targetTitle: 'JavaScript',
            clientKey: 'axios',
          },
        ],
      },
      {
        label: 'Python',
        key: 'python',
        options: [
          {
            id: 'python/requests',
            lang: 'python',
            title: 'Python Requests',
            label: 'Requests',
            targetKey: 'python',
            targetTitle: 'Python',
            clientKey: 'requests',
          },
        ],
      },
    ]

    const result = getClients(customCodeSamples, clientOptions)

    // Should return the exact same reference
    expect(result).toBe(clientOptions)
    expect(result).toHaveLength(2)
    expect(result).toEqual(clientOptions)
  })

  /**
   * Test 4: Verifies correct handling of duplicate languages and special characters
   * This is critical because real-world OpenAPI specs may contain multiple custom examples
   * for the same language (e.g., sync and async Python clients), and they should be
   * grouped together under one language group while maintaining distinct IDs.
   */
  it('groups duplicate languages together while keeping distinct IDs', () => {
    const customCodeSamples: XCodeSample[] = [
      {
        lang: 'python',
        label: 'Python Example 1',
        source: 'import requests',
      },
      {
        lang: 'python',
        label: 'Python Example 2',
        source: 'import httpx',
      },
      {
        lang: 'c++',
        label: 'C++ Example',
        source: '#include <iostream>',
      },
      {
        lang: 'objective-c',
        label: 'Objective-C Example',
        source: '@interface MyClass',
      },
    ]

    const clientOptions: ClientOptionGroup[] = [
      {
        label: 'Shell',
        key: 'shell',
        options: [
          {
            id: 'shell/curl',
            lang: 'curl',
            title: 'Shell cURL',
            label: 'cURL',
            targetKey: 'shell',
            targetTitle: 'Shell',
            clientKey: 'curl',
          },
        ],
      },
    ]

    const result = getClients(customCodeSamples, clientOptions)

    // Should have 3 custom groups (python, c++, objective-c) + 1 original (shell)
    expect(result).toHaveLength(4)

    // First group is Python with both samples
    const pythonGroup = result[0]
    expect(pythonGroup?.label).toBe('Python')
    expect(pythonGroup?.key).toBe('custom-python')
    expect(pythonGroup?.options).toHaveLength(2)

    // Both python examples must have distinct IDs so they stay individually selectable
    const firstPythonOption = pythonGroup?.options[0]
    expect(firstPythonOption).toMatchObject({
      id: 'custom/0',
      lang: 'python',
      label: 'Python Example 1',
    })

    const secondPythonOption = pythonGroup?.options[1]
    expect(secondPythonOption).toMatchObject({
      id: 'custom/1',
      lang: 'python',
      label: 'Python Example 2',
    })

    expect(firstPythonOption?.id).not.toBe(secondPythonOption?.id)

    // Second group is C++
    const cppGroup = result[1]
    expect(cppGroup?.label).toBe('C++')
    expect(cppGroup?.key).toBe('custom-c++')
    expect(cppGroup?.options).toHaveLength(1)
    expect(cppGroup?.options[0]).toMatchObject({
      id: 'custom/2',
      lang: 'c++',
      label: 'C++ Example',
    })

    // Third group is Objective-c (capitalized)
    const objcGroup = result[2]
    expect(objcGroup?.label).toBe('Objective-c')
    expect(objcGroup?.key).toBe('custom-objective-c')
    expect(objcGroup?.options).toHaveLength(1)
    expect(objcGroup?.options[0]).toMatchObject({
      id: 'custom/3',
      lang: 'objective-c',
      label: 'Objective-C Example',
    })

    // Original client options should still be present at the end
    expect(result[3]).toEqual(clientOptions[0])
  })
})
