import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getRenderedExample } from './helpers/get-rendered-example'
import SchemaPropertyExamples from './SchemaPropertyExamples.vue'

enableAutoUnmount(afterEach)

describe('SchemaPropertyExamples', () => {
  it('renders a single example when the value is false', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        example: false,
      },
    })

    expect(wrapper.find('.property-example').exists()).toBe(true)
    expect(wrapper.text()).toContain('Example')
    expect(wrapper.text()).toContain('false')
  })

  it('renders a single example when the value is 0', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        example: 0,
      },
    })

    expect(wrapper.find('.property-example').exists()).toBe(true)
    expect(wrapper.text()).toContain('Example')
    expect(wrapper.text()).toContain('0')
  })

  it('renders a single example when the value is an empty string', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        example: '',
      },
    })

    expect(wrapper.find('.property-example').exists()).toBe(true)
    expect(wrapper.find('.property-example-value span').text()).toBe('')
  })

  it('renders a single example when the value is null', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        example: null,
      },
    })

    expect(wrapper.find('.property-example').exists()).toBe(true)
    expect(wrapper.text()).toContain('Example')
    expect(wrapper.text()).toContain('null')
  })

  it('does not render a single example when the value is undefined', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        example: undefined,
      },
    })

    expect(wrapper.find('.property-example').exists()).toBe(false)
  })

  it('renders a single example when the value is a whitespace-only string', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        example: ' ',
      },
    })

    expect(wrapper.find('.property-example').exists()).toBe(true)
    expect(wrapper.find('.property-example-value span').text()).toBe('')
  })

  it('renders a single example for an object value without unwrapping', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        example: { testProperty: 'testValue' },
      },
    })

    expect(wrapper.find('.property-example').exists()).toBe(true)
    expect(wrapper.text()).toContain('{"testProperty":"testValue"}')
  })

  it('unwraps `value` from OpenAPI Example Objects in the `examples` map', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        examples: {
          first: { summary: 'A name', value: 'Alice' },
          second: { value: 42 },
        },
      },
    })

    const buttons = wrapper.findAll('button[aria-label]')
    expect(buttons[0]?.attributes('aria-label')).toBe('Copy example value: A name: Alice')
    expect(buttons[1]?.attributes('aria-label')).toBe('Copy example value: second: 42')
  })

  it('unwraps `externalValue` from OpenAPI Example Objects in the `examples` map', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        examples: {
          remote: { externalValue: 'https://example.com/sample.json' },
        },
      },
    })

    expect(wrapper.get('button[aria-label]').attributes('aria-label')).toBe(
      'Copy example value: remote: https://example.com/sample.json',
    )
  })
  it('distinguishes equal values by summary or name and copies only the value', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        examples: [
          getRenderedExample({ summary: 'Session cookies', serializedValue: 'session=abc\ntheme=dark' }, 'first'),
          getRenderedExample({ summary: '', serializedValue: 'session=abc\ntheme=dark' }, 'fallback-name'),
        ],
      },
    })
    try {
      const buttons = wrapper.findAll('button[aria-label]')
      expect(buttons.map((button) => button.attributes('aria-label'))).toStrictEqual([
        'Copy example value: Session cookies: session=abc\ntheme=dark',
        'Copy example value: fallback-name: session=abc\ntheme=dark',
      ])
      await buttons[0]!.trigger('click')
      await buttons[1]!.trigger('click')
      expect(writeText.mock.calls).toStrictEqual([['session=abc\ntheme=dark'], ['session=abc\ntheme=dark']])
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('renders raw schema objects with metadata-like fields without labels or unwrapping', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: { examples: [{ value: 'payload', summary: 'payload summary' }, false] },
    })
    expect(wrapper.findAll('button[aria-label]').map((button) => button.attributes('aria-label'))).toStrictEqual([
      'Copy example value: {"value":"payload","summary":"payload summary"}',
      'Copy example value: false',
    ])
  })

  it('renders names and summaries as text, including numeric map keys', () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: {
        examples: {
          '<img src=x onerror=alert(1)>': { value: 'one' },
          'summary': { summary: '<script>alert(1)</script>', value: 'two' },
          '0': { value: 'three' },
        },
      },
    })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.findAll('button[aria-label]').map((button) => button.attributes('aria-label'))).toStrictEqual([
      'Copy example value: 0: three',
      'Copy example value: <img src=x onerror=alert(1)>: one',
      'Copy example value: <script>alert(1)</script>: two',
    ])
  })

  it('opens on keyboard focus and restores focus to the trigger on Escape', async () => {
    const wrapper = mount(SchemaPropertyExamples, {
      attachTo: document.body,
      props: { examples: { named: { summary: 'Label', value: 'sample' } } },
    })
    const trigger = wrapper.get('button[aria-expanded]')
    ;(trigger.element as HTMLButtonElement).focus()
    await wrapper.vm.$nextTick()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    const copy = wrapper.get('button[aria-label]')
    ;(copy.element as HTMLButtonElement).focus()
    await copy.trigger('keydown', { key: 'Escape' })
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger.element)
  })

  it('keeps a touch-style pointer focus and click from toggling twice', async () => {
    const wrapper = mount(SchemaPropertyExamples, {
      props: { examples: { named: { summary: 'Label', value: 'sample' } } },
    })
    const trigger = wrapper.get('button[aria-expanded]')
    await trigger.trigger('pointerdown', { pointerType: 'touch' })
    await trigger.trigger('focusin')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    await trigger.trigger('focusout', { relatedTarget: document.body })
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })
})
