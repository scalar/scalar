import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import CodeInput from './CodeInput.vue'
import { useCodeMirror } from '@scalar/use-codemirror'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { enableConsoleError, enableConsoleWarn } from '@/vitest.setup'
import { ref, toValue } from 'vue'
import { environmentSchema } from '@scalar/oas-utils/entities/environment'
import { workspaceSchema } from '@scalar/oas-utils/entities/workspace'
import { nanoid } from 'nanoid'

// Mock dependencies
vi.mock('@scalar/use-codemirror', async (importOriginal) => {
  const actual = await importOriginal<typeof useCodeMirror>()
  return {
    ...actual,
    useCodeMirror: vi.fn(() => ({
      codeMirror: ref({
        focus: vi.fn(),
        dispatch: vi.fn(),
        state: { doc: { length: 10 } },
      }),
      view: { value: null },
      container: { value: null },
      updateExtensions: vi.fn(),
    })),
  }
})

vi.mock('@scalar/use-hooks/useClipboard', () => ({
  useClipboard: vi.fn(() => ({
    copy: vi.fn(),
    copyToClipboard: vi.fn(),
    copied: { value: false },
  })),
}))

vi.mock('@/hooks', () => ({
  useLayout: vi.fn(() => ({
    layout: { value: { isMobile: false } },
  })),
}))

describe('CodeInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    enableConsoleWarn()
    enableConsoleError()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const defaultProps = {
    modelValue: 'test value',
    environment: environmentSchema.parse({
      uid: nanoid(),
      name: 'Test Environment',
      value: 'test',
      color: '#000000',
    }),
    envVariables: [],
    workspace: workspaceSchema.parse({
      name: 'Test Workspace',
    }),
  }

  const createWrapper = (props = {}, attrs = {}) => {
    return mount(CodeInput, {
      props: {
        ...defaultProps,
        ...props,
      },
      attrs,
      global: {
        stubs: {
          DataTableInputSelect: true,
          ScalarIcon: true,
          EnvironmentVariableDropdown: true,
        },
      },
    })
  }

  let wrapper: VueWrapper<InstanceType<typeof CodeInput>>

  it('renders correctly when not disabled', async () => {
    wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
    expect(useCodeMirror).toHaveBeenCalled()
  })

  it('renders in disabled state correctly', async () => {
    wrapper = createWrapper({ disabled: true })
    expect(wrapper.html()).toContain('data-testid="code-input-disabled"')
  })

  it('emits update:modelValue when value changes', async () => {
    wrapper = createWrapper()
    wrapper.vm.handleChange('new value')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['new value'])
  })

  it('emits submit event when handleSubmit is called', async () => {
    wrapper = createWrapper()
    wrapper.vm.handleSubmit('test value')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]).toEqual(['test value'])
  })

  it('emits blur event when handleBlur is called', async () => {
    wrapper = createWrapper()
    wrapper.vm.handleBlur('test value')

    expect(wrapper.emitted('blur')).toBeTruthy()
    expect(wrapper.emitted('blur')?.[0]).toEqual(['test value'])
  })

  it('uses custom field handler when provided', async () => {
    const handleFieldChange = vi.fn()
    wrapper = createWrapper({ handleFieldChange })
    wrapper.vm.handleChange('handle field change')

    expect(handleFieldChange).toHaveBeenCalledWith('handle field change')
  })

  it('computes booleanOptions correctly for boolean type', async () => {
    wrapper = createWrapper({
      type: 'boolean',
      nullable: false,
    })
    expect(wrapper.vm.booleanOptions).toEqual(['true', 'false'])
  })

  it('computes booleanOptions correctly for boolean type with nullable', async () => {
    wrapper = createWrapper({
      type: 'boolean',
      nullable: true,
    })
    expect(wrapper.vm.booleanOptions).toEqual(['true', 'false', 'null'])
  })

  it('exposes focus method that calls codeMirror.focus', async () => {
    wrapper = createWrapper()

    // Get the mocked focus function from the useCodeMirror mock
    const mockCodeMirror = vi.mocked(useCodeMirror).mock.results[0]?.value.codeMirror.value

    // Call the exposed focus method
    wrapper.vm.focus()

    // Verify the mocked focus method was called
    expect(mockCodeMirror.focus).toHaveBeenCalled()
  })

  it('copies content when copy button is clicked', async () => {
    wrapper = createWrapper({ isCopyable: true })

    const copyButton = wrapper.find('.copy-button')
    await copyButton.trigger('click')

    expect(vi.mocked(useClipboard).mock.results[0]?.value.copyToClipboard).toHaveBeenCalledWith(wrapper.vm.modelValue)
  })

  it('applies error class when error prop is true', async () => {
    wrapper = createWrapper({ error: true })
    expect(wrapper.html()).toContain('flow-code-input--error')
  })

  it('sets up extensions correctly based on props', async () => {
    wrapper = createWrapper({
      language: 'json',
      colorPicker: true,
      lineNumbers: true,
      lint: true,
    })

    // Check that extensions are set up correctly
    const extensions = toValue(vi.mocked(useCodeMirror).mock.calls[0]?.[0].extensions)
    expect(extensions?.length).toBeGreaterThan(0)
  })
})
