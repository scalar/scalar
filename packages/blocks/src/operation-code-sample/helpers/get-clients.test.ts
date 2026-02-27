import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import { describe, expect, it } from 'vitest'

import type { ClientOptionGroup, CustomClientOption } from '@/v2/blocks/operation-code-sample'

import { getClients } from './get-clients'

describe('getClients', () => {
  /**
   * Test 1: Verifies that custom code samples are properly transformed and prepended
   * This is critical because it ensures custom examples appear first in the UI
   * and are correctly structured with all required properties.
   */
  it('should merge custom code samples with client options and prepend them as a group', () => {
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

    // Should have one more group than the original client options
    expect(result).toHaveLength(2)

    // First group should be the custom code examples
    expect(result[0]).toEqual({
      label: 'Code Examples',
      options: [
        {
          id: 'custom/python',
          lang: 'python',
          clientKey: 'custom',
          title: 'Custom Python Example',
          label: 'Custom Python Example',
        },
        {
          id: 'custom/js',
          lang: 'js',
          clientKey: 'custom',
          title: 'Custom JS Example',
          label: 'Custom JS Example',
        },
      ] satisfies CustomClientOption[],
    })

    // Original client options should follow
    expect(result[1]).toEqual(clientOptions[0])
  })

  /**
   * Test 2: Verifies fallback behavior when optional fields are missing
   * This is critical because the OpenAPI spec allows lang and label to be optional,
   * and we need to handle these cases gracefully without breaking the UI.
   */
  it('should handle custom code samples with missing lang and label fields', () => {
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

    expect(result).toHaveLength(1)
    const firstGroup = result[0]
    expect(firstGroup).toBeDefined()
    expect(firstGroup?.label).toBe('Code Examples')
    expect(firstGroup?.options).toHaveLength(3)

    // When both lang and label are missing, should use the generated ID
    const firstOption = result[0]?.options[0]
    expect(firstOption).toBeDefined()
    expect(firstOption).toMatchObject({
      id: 'custom/undefined',
      lang: 'plaintext',
      title: 'custom/undefined',
      label: 'custom/undefined',
    })

    // When label is missing, should use lang
    const secondOption = result[0]?.options[1]
    expect(secondOption).toBeDefined()
    expect(secondOption).toMatchObject({
      id: 'custom/ruby',
      lang: 'ruby',
      title: 'ruby',
      label: 'ruby',
    })

    // When lang is missing, should use label and default to plaintext
    const thirdOption = result[0]?.options[2]
    expect(thirdOption).toBeDefined()
    expect(thirdOption).toMatchObject({
      id: 'custom/undefined',
      lang: 'plaintext',
      title: 'Special Example',
      label: 'Special Example',
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
   * Test 4: Verifies correct handling of edge cases with duplicate languages and special characters
   * This is critical because real-world OpenAPI specs may contain duplicate custom examples
   * or unusual language identifiers, and the function must handle these without errors.
   */
  it('should handle duplicate languages and special characters in custom code samples', () => {
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

    expect(result).toHaveLength(2)
    expect(result[0]?.label).toBe('Code Examples')
    expect(result[0]?.options).toHaveLength(4)

    // Both python examples should be included with the same ID but different labels
    const firstPythonOption = result[0]?.options[0]
    expect(firstPythonOption).toBeDefined()
    expect(firstPythonOption).toMatchObject({
      id: 'custom/python',
      lang: 'python',
      label: 'Python Example 1',
    })

    const secondPythonOption = result[0]?.options[1]
    expect(secondPythonOption).toBeDefined()
    expect(secondPythonOption).toMatchObject({
      id: 'custom/python',
      lang: 'python',
      label: 'Python Example 2',
    })

    // Special characters in language names should be preserved
    const cppOption = result[0]?.options[2]
    expect(cppOption).toBeDefined()
    expect(cppOption).toMatchObject({
      id: 'custom/c++',
      lang: 'c++',
      label: 'C++ Example',
    })

    const objcOption = result[0]?.options[3]
    expect(objcOption).toBeDefined()
    expect(objcOption).toMatchObject({
      id: 'custom/objective-c',
      lang: 'objective-c',
      label: 'Objective-C Example',
    })

    // Original client options should still be present
    expect(result[1]).toEqual(clientOptions[0])
  })
})
