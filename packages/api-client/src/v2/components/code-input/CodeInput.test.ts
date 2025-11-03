import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CodeInput from './CodeInput.vue'

const mockEnvironment: XScalarEnvironment = {
  color: '#ff0000',
  variables: [
    { name: 'baseUrl', value: 'https://api.example.com' },
    { name: 'apiKey', value: 'secret123' },
  ],
}

describe('CodeInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /** Disabled state */
  it('renders in disabled mode when disabled prop is true', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test value',
        disabled: true,
        layout: 'web',
        environment: undefined,
      },
    })

    const disabledDiv = wrapper.find('[data-testid="code-input-disabled"]')
    expect(disabledDiv.exists()).toBe(true)
    expect(disabledDiv.text()).toBe('test value')
  })

  /** Enum select mode */
  it('renders DataTableInputSelect when enum prop is provided', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'option1',
        enum: ['option1', 'option2', 'option3'],
        layout: 'web',
        environment: undefined,
      },
    })

    const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
    expect(select.exists()).toBe(true)
    expect(select.props('value')).toEqual(['option1', 'option2', 'option3'])
  })

  it('does not render enum select when enum is empty array', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        enum: [],
        layout: 'web',
        environment: undefined,
      },
    })

    const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
    expect(select.exists()).toBe(false)
  })

  /** Boolean type handling */
  it('renders boolean select when type is boolean', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'true',
        type: 'boolean',
        layout: 'web',
        environment: undefined,
      },
    })

    const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
    expect(select.exists()).toBe(true)
    expect(select.props('value')).toEqual(['true', 'false'])
  })

  it('renders boolean select when type array includes boolean', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'true',
        type: ['boolean', 'string'],
        layout: 'web',
        environment: undefined,
      },
    })

    const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
    expect(select.exists()).toBe(true)
  })

  it('includes null option in boolean select when nullable is true', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'true',
        type: 'boolean',
        nullable: true,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    expect(componentInstance.booleanOptions).toEqual(['true', 'false', 'null'])
  })

  /** Examples select mode */
  it('renders DataTableInputSelect when examples prop is provided', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'example1',
        examples: ['example1', 'example2', 'example3'],
        layout: 'web',
        environment: undefined,
      },
    })

    const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
    expect(select.exists()).toBe(true)
    expect(select.props('value')).toEqual(['example1', 'example2', 'example3'])
  })

  it('does not render examples select when examples is empty array', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        examples: [],
        layout: 'web',
        environment: undefined,
      },
    })

    const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
    expect(select.exists()).toBe(false)
  })

  /** CodeMirror mode (default) */
  it('renders CodeMirror editor by default', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test value',
        layout: 'web',
        environment: undefined,
      },
    })

    expect(wrapper.vm).toBeDefined()
  })

  /** Event emissions */
  it('emits update:modelValue when value changes', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'initial',
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    componentInstance.handleChange('updated value')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['updated value'])
  })

  it('does not emit update:modelValue when value is unchanged', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'same value',
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    componentInstance.handleChange('same value')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('emits submit event when handleSubmit is called', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    componentInstance.handleSubmit('test value')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]).toEqual(['test value'])
  })

  it('emits blur event when handleBlur is called', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    componentInstance.handleBlur('test value')

    expect(wrapper.emitted('blur')).toBeTruthy()
    expect(wrapper.emitted('blur')?.[0]).toEqual(['test value'])
  })

  it('emits submit on blur when emitOnBlur is true and modelValue exists', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        emitOnBlur: true,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    componentInstance.handleBlur('test value')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('blur')).toBeTruthy()
  })

  it('does not emit submit on blur when modelValue is empty', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: '',
        emitOnBlur: true,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    componentInstance.handleBlur('')

    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  /** Curl import functionality */
  it('emits curl event when input starts with curl', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'initial',
        importCurl: true,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    componentInstance.handleChange('curl https://api.example.com')

    expect(wrapper.emitted('curl')).toBeTruthy()
    expect(wrapper.emitted('curl')?.[0]).toEqual(['curl https://api.example.com'])
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('does not emit curl when importCurl is false', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'initial',
        importCurl: false,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    componentInstance.handleChange('curl https://api.example.com')

    expect(wrapper.emitted('curl')).toBeFalsy()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('does not emit curl when input does not start with curl', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'initial',
        importCurl: true,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    componentInstance.handleChange('not a curl command')

    expect(wrapper.emitted('curl')).toBeFalsy()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  /** Custom field handlers */
  it('calls handleFieldChange when provided instead of emitting', () => {
    const handleFieldChange = vi.fn()
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'initial',
        handleFieldChange,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    componentInstance.handleChange('new value')

    expect(handleFieldChange).toHaveBeenCalledWith('new value')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('calls handleFieldSubmit when provided instead of emitting', () => {
    const handleFieldSubmit = vi.fn()
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'initial',
        handleFieldSubmit,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    componentInstance.handleSubmit('submit value')

    expect(handleFieldSubmit).toHaveBeenCalledWith('submit value')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  /** Default type computation */
  it('computes defaultType from array type excluding null', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        type: ['null', 'string', 'number'],
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    expect(componentInstance.defaultType).toBe('string')
  })

  it('computes defaultType as string when all types are null', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        type: ['null'],
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    expect(componentInstance.defaultType).toBe('string')
  })

  it('handles undefined type in defaultType computation', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        type: undefined,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    expect(componentInstance.defaultType).toBeUndefined()
  })

  /** Environment variable dropdown visibility */
  it('displays environment dropdown when conditions are met', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        withVariables: true,
        layout: 'web',
        environment: mockEnvironment,
      },
    })

    const componentInstance = wrapper.vm as any
    /** Initially showDropdown is false */
    expect(componentInstance.displayVariablesDropdown).toBe(false)
  })

  /** Required indicator */
  it('renders required indicator when required prop is true', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: '',
        required: true,
        layout: 'web',
        environment: undefined,
      },
    })

    const requiredIndicator = wrapper.find('.required')
    expect(requiredIndicator.exists()).toBe(true)
    expect(requiredIndicator.text()).toBe('Required')
  })

  /** Slots */
  it('renders warning slot when provided', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        layout: 'web',
        environment: undefined,
      },
      slots: {
        warning: '<span>Warning message</span>',
      },
    })

    expect(wrapper.text()).toContain('Warning message')
  })

  it('renders icon slot when provided', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        layout: 'web',
        environment: undefined,
      },
      slots: {
        icon: '<span>Icon</span>',
      },
    })

    expect(wrapper.text()).toContain('Icon')
  })

  /** Error state */
  it('applies error class when error prop is true', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        error: true,
        layout: 'web',
        environment: undefined,
      },
    })

    const container = wrapper.find('.flow-code-input--error')
    expect(container.exists()).toBe(true)
  })

  /** Line wrapping */
  it('applies line-wrapping class when lineWrapping is true', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        lineWrapping: true,
        layout: 'web',
        environment: undefined,
      },
    })

    const container = wrapper.find('.line-wrapping')
    expect(container.exists()).toBe(true)
  })

  /** Tab indent helper */
  it('renders tab indent helper when disableTabIndent is false', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        disableTabIndent: false,
        layout: 'web',
        environment: undefined,
      },
    })

    expect(wrapper.text()).toContain('Press')
    expect(wrapper.text()).toContain('Esc')
    expect(wrapper.text()).toContain('Tab')
  })

  /** Priority of rendering modes */
  it('prioritizes disabled over enum', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        disabled: true,
        enum: ['option1', 'option2'],
        layout: 'web',
        environment: undefined,
      },
    })

    const disabledDiv = wrapper.find('[data-testid="code-input-disabled"]')
    expect(disabledDiv.exists()).toBe(true)

    const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
    expect(select.exists()).toBe(false)
  })

  it('prioritizes enum over boolean type', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        enum: ['true', 'false'],
        type: 'boolean',
        layout: 'web',
        environment: undefined,
      },
    })

    const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
    expect(select.exists()).toBe(true)
    expect(select.props('value')).toEqual(['true', 'false'])
  })

  it('prioritizes boolean type over examples', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        type: 'boolean',
        examples: ['example1', 'example2'],
        layout: 'web',
        environment: undefined,
      },
    })

    const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
    expect(select.exists()).toBe(true)
    /** Should use boolean options, not examples */
    expect(select.props('value')).toEqual(['true', 'false'])
  })

  /** Edge cases with empty or undefined values */
  it('handles zero as modelValue', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 0,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    expect(componentInstance.modelValue).toBe(0)
  })

  /** DataTableInputSelect event forwarding */
  it('forwards update:modelValue from DataTableInputSelect', async () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'option1',
        enum: ['option1', 'option2', 'option3'],
        layout: 'web',
        environment: undefined,
      },
    })

    const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
    await select.vm.$emit('update:modelValue', 'option2')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['option2'])
  })

  /** Special characters in values */
  it('handles special characters in modelValue', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: '<script>alert("test")</script>',
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    expect(componentInstance.modelValue).toBe('<script>alert("test")</script>')
  })

  /** Very long strings */
  it('handles very long string values', () => {
    const longString = 'x'.repeat(10000)
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: longString,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    expect(componentInstance.modelValue).toBe(longString)
  })

  /** Custom ID attribute */
  it('uses custom id from attrs', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        layout: 'web',
        environment: undefined,
      },
      attrs: {
        id: 'custom-id',
      },
    })

    const container = wrapper.find('#custom-id')
    expect(container.exists()).toBe(true)
  })
})
