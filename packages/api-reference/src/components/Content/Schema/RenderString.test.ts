import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RenderString from './RenderString.vue'

describe('RenderString', () => {
  /**
   * Test that empty string is rendered with quotes
   */
  it('renders empty string with quotes', () => {
    const wrapper = mount(RenderString, {
      props: {
        value: '',
      },
    })

    expect(wrapper.text()).toBe("''")
  })

  /**
   * Test that null value is rendered as "null"
   */
  it('renders null as "null"', () => {
    const wrapper = mount(RenderString, {
      props: {
        value: null,
      },
    })

    expect(wrapper.text()).toBe('null')
  })

  /**
   * Test that undefined value is rendered as "undefined"
   */
  it('renders undefined as "undefined"', () => {
    const wrapper = mount(RenderString, {
      props: {
        value: undefined,
      },
    })

    expect(wrapper.text()).toBe('undefined')
  })

  /**
   * Test that regular strings are rendered as-is
   */
  it('renders regular strings as-is', () => {
    const testCases = ['hello world', 'test string', '123', 'true', 'false']

    testCases.forEach((testValue) => {
      const wrapper = mount(RenderString, {
        props: {
          value: testValue,
        },
      })

      expect(wrapper.text()).toBe(testValue)
    })
  })

  /**
   * Test that numbers are rendered as strings
   */
  it('renders numbers as strings', () => {
    const testCases = [0, 42, -1, 3.14, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN]

    testCases.forEach((testValue) => {
      const wrapper = mount(RenderString, {
        props: {
          value: testValue,
        },
      })

      expect(wrapper.text()).toBe(String(testValue))
    })
  })

  /**
   * Test that booleans are rendered as strings
   */
  it('renders booleans as strings', () => {
    const wrapperTrue = mount(RenderString, {
      props: {
        value: true,
      },
    })

    const wrapperFalse = mount(RenderString, {
      props: {
        value: false,
      },
    })

    expect(wrapperTrue.text()).toBe('true')
    expect(wrapperFalse.text()).toBe('false')
  })

  /**
   * Test that objects are rendered as strings
   */
  it('renders objects as strings', () => {
    const testObject = { key: 'value', number: 42 }
    const wrapper = mount(RenderString, {
      props: {
        value: testObject,
      },
    })

    expect(wrapper.text()).toBe(JSON.stringify(testObject, null, 2))
  })

  /**
   * Test that arrays are rendered as strings
   */
  it('renders arrays as strings', () => {
    const testArray = [1, 2, 3, 'test']
    const wrapper = mount(RenderString, {
      props: {
        value: testArray,
      },
    })

    expect(wrapper.text()).toBe(JSON.stringify(testArray, null, 2))
  })

  /**
   * Test that functions are rendered as strings
   */
  it('renders functions as strings', () => {
    const testFunction = () => 'test'
    const wrapper = mount(RenderString, {
      props: {
        value: testFunction,
      },
    })

    expect(wrapper.text()).toContain(testFunction.toString())
  })

  /**
   * Test that symbols are rendered as strings
   */
  it('renders symbols as strings', () => {
    const testSymbol = Symbol('test')
    const wrapper = mount(RenderString, {
      props: {
        value: testSymbol,
      },
    })

    expect(wrapper.text()).toBe('Symbol(test)')
  })

  /**
   * Test edge cases with special characters
   */
  it('renders strings with special characters correctly', () => {
    const testCases = [
      'string with spaces',
      'string\nwith\nnewlines',
      'string\twith\ttabs',
      'string with "quotes"',
      "string with 'single quotes'",
      'string with unicode: 🚀',
    ]

    testCases.forEach((testValue) => {
      const wrapper = mount(RenderString, {
        props: {
          value: testValue,
        },
      })

      expect(wrapper.text()).toBe(testValue)
    })
  })

  /**
   * Test that the component updates when props change
   */
  it('updates when props change', async () => {
    const wrapper = mount(RenderString, {
      props: {
        value: 'initial',
      },
    })

    expect(wrapper.text()).toBe('initial')

    await wrapper.setProps({ value: 'updated' })
    expect(wrapper.text()).toBe('updated')

    await wrapper.setProps({ value: null })
    expect(wrapper.text()).toBe('null')

    await wrapper.setProps({ value: '' })
    expect(wrapper.text()).toBe("''")
  })

  /**
   * Test that the component handles edge cases gracefully
   */
  it('handles edge cases gracefully', () => {
    const edgeCases = [
      new Date('2023-01-01'),
      new Error('test error'),
      new Map([['key', 'value']]),
      new Set([1, 2, 3]),
      new RegExp('test'),
    ]

    edgeCases.forEach((edgeCase) => {
      const wrapper = mount(RenderString, {
        props: {
          value: edgeCase,
        },
      })

      // Should not throw and should render something
      expect(wrapper.text()).toBeDefined()
      expect(typeof wrapper.text()).toBe('string')
    })
  })
})
