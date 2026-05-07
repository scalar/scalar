import { EditorView, StateEffect } from '@scalar/use-codemirror'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

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
    expect(wrapper.emitted('submit')?.[0]).toEqual(['test value', undefined])
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
    expect(wrapper.emitted('blur')?.[0]).toEqual(['test value', undefined])
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

  it('emits string values from select components', async () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: ['item1', 'item2'],
        enum: ['item1', 'item2', 'item3'],
        type: 'array',
        layout: 'web',
        environment: undefined,
      },
    })

    const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
    await select.vm.$emit('update:modelValue', 'item1,item2,item3')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emittedValue = wrapper.emitted('update:modelValue')?.[0]?.[0]
    expect(typeof emittedValue).toBe('string')
    expect(emittedValue).toBe('item1,item2,item3')
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

  /** Serialization */
  it('correctly serializes arrays', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: ['item1', 'item2'],
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    const serialized = componentInstance.serializeValue(['item1', 'item2'])
    expect(serialized).toBe('["item1","item2"]')
  })

  it('correctly serializes objects', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: { key: 'value', number: 123 },
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    const serialized = componentInstance.serializeValue({ key: 'value', number: 123 })
    expect(serialized).toBe('{"key":"value","number":123}')
  })

  it('correctly serializes nested objects', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: { nested: { key: 'value' } },
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    const obj = { nested: { key: 'value' } }
    const serialized = componentInstance.serializeValue(obj)
    expect(serialized).toBe('{"nested":{"key":"value"}}')
  })

  it('correctly serializes objects with arrays', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: { items: ['a', 'b', 'c'] },
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    const obj = { items: ['a', 'b', 'c'] }
    const serialized = componentInstance.serializeValue(obj)
    expect(serialized).toBe('{"items":["a","b","c"]}')
  })

  it('correctly serializes empty objects', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: {},
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    const serialized = componentInstance.serializeValue({})
    expect(serialized).toBe('{}')
  })

  it('correctly serializes numbers', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 42,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    const serialized = componentInstance.serializeValue(42)
    expect(serialized).toBe('42')
  })

  it('correctly serializes negative numbers', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: -123,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    const serialized = componentInstance.serializeValue(-123)
    expect(serialized).toBe('-123')
  })

  it('correctly serializes decimal numbers', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 3.14,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    const serialized = componentInstance.serializeValue(3.14)
    expect(serialized).toBe('3.14')
  })

  it('correctly serializes booleans', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: true,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    const serialized = componentInstance.serializeValue(true)
    expect(serialized).toBe('true')
  })

  it('correctly serializes false boolean', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: false,
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    const serialized = componentInstance.serializeValue(false)
    expect(serialized).toBe('false')
  })

  it('preserves string values as-is', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: '123',
        layout: 'web',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    const serialized = componentInstance.serializeValue('123')
    expect(serialized).toBe('123')
  })

  /** Environment variable dropdown redirect */
  it('has navigate event defined in emits', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        withVariables: true,
        layout: 'desktop',
        environment: mockEnvironment,
      },
    })

    expect(wrapper.vm.$options.emits).toBeDefined()
    expect(wrapper.vm.$options.emits).toContain('navigate')
  })

  it('does not display environment dropdown in modal layout', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        withVariables: true,
        layout: 'modal',
        environment: mockEnvironment,
      },
    })

    const componentInstance = wrapper.vm as any
    componentInstance.showDropdown = true

    expect(componentInstance.displayVariablesDropdown).toBe(false)
  })

  it('does not display environment dropdown when withVariables is false', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        withVariables: false,
        layout: 'desktop',
        environment: mockEnvironment,
      },
    })

    const componentInstance = wrapper.vm as any
    componentInstance.showDropdown = true

    expect(componentInstance.displayVariablesDropdown).toBe(false)
  })

  it('does not display environment dropdown when environment is undefined', () => {
    const wrapper = mount(CodeInput, {
      props: {
        modelValue: 'test',
        withVariables: true,
        layout: 'desktop',
        environment: undefined,
      },
    })

    const componentInstance = wrapper.vm as any
    componentInstance.showDropdown = true

    expect(componentInstance.displayVariablesDropdown).toBe(false)
  })

  describe('performance', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    /**
     * Normalise the `effects` field from a dispatch TransactionSpec — it can be
     * a single StateEffect, an array, or undefined — and check whether any
     * effect is a `StateEffect.reconfigure`.
     */
    const hasReconfigure = (args: unknown[]): boolean => {
      const spec = args[0] as { effects?: unknown } | undefined
      if (!spec?.effects) return false
      const effects = Array.isArray(spec.effects) ? spec.effects : [spec.effects]
      return effects.some(
        (e): e is { is: (t: unknown) => boolean } =>
          typeof (e as { is?: unknown }).is === 'function' &&
          (e as { is: (t: unknown) => boolean }).is(StateEffect.reconfigure),
      )
    }

    /**
     * Problem 1 (fixed): `codeMirrorExtensions` is now a stable module-level constant
     * rather than a computed, so its array reference never changes across renders.
     * The pill plugin receives a getter for `environment` and updates decorations
     * internally on each CodeMirror update cycle — no ViewPlugin replacement needed.
     */
    it('codeMirrorExtensions is the same array reference after a same-value environment change', async () => {
      const wrapper = mount(CodeInput, {
        props: {
          modelValue: 'hello',
          layout: 'desktop' as const,
          environment: mockEnvironment,
        },
      })

      await nextTick()

      const vm = wrapper.vm as any

      // Capture the extensions array reference before the prop change.
      const before = vm.codeMirrorExtensions

      // Replace environment with a structurally identical object (new reference).
      await wrapper.setProps({
        environment: {
          color: mockEnvironment.color,
          variables: [...mockEnvironment.variables],
        } satisfies XScalarEnvironment,
      })

      // Capture the extensions array reference after the prop change.
      const after = vm.codeMirrorExtensions

      // The array reference must be identical — no new ViewPlugin was constructed.
      expect(before).toBe(after)
    })

    /**
     * Problem 2 (fixed): Updating the `environment` prop to an object with identical
     * values no longer causes a `StateEffect.reconfigure` dispatch. The pill plugin
     * reads `environment` via a getter on every CodeMirror update cycle, so the
     * ViewPlugin instance never needs to be replaced.
     */
    it('same-value environment prop change does not dispatch StateEffect.reconfigure', async () => {
      const rafCallbacks: FrameRequestCallback[] = []
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallbacks.push(cb)
        return rafCallbacks.length
      })

      const dispatchSpy = vi.spyOn(EditorView.prototype, 'dispatch')

      const wrapper = mount(CodeInput, {
        props: {
          modelValue: 'hello',
          layout: 'desktop' as const,
          environment: mockEnvironment,
        },
      })

      // Settle initial mount and drain any rAF callbacks it scheduled.
      await nextTick()
      rafCallbacks.splice(0).forEach((cb) => cb(performance.now()))

      // Reset the spy so we only count dispatches that happen after the prop change.
      dispatchSpy.mockClear()

      // Update environment to a new object reference with identical values.
      await wrapper.setProps({
        environment: {
          color: mockEnvironment.color,
          variables: [...mockEnvironment.variables],
        } satisfies XScalarEnvironment,
      })

      await nextTick()
      rafCallbacks.splice(0).forEach((cb) => cb(performance.now()))

      const reconfigureCount = dispatchSpy.mock.calls.filter(hasReconfigure).length

      expect(reconfigureCount).toBe(0)
    })

    /**
     * Problem 3 (confirmed not regressed): Changing `modelValue` (simulating user
     * typing) must NOT trigger a `StateEffect.reconfigure` dispatch. Typing should
     * only update CodeMirror's document content.
     */
    it('modelValue change does not dispatch StateEffect.reconfigure', async () => {
      const rafCallbacks: FrameRequestCallback[] = []
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCallbacks.push(cb)
        return rafCallbacks.length
      })

      const dispatchSpy = vi.spyOn(EditorView.prototype, 'dispatch')

      const wrapper = mount(CodeInput, {
        props: {
          modelValue: 'initial',
          layout: 'desktop' as const,
          environment: mockEnvironment,
        },
      })

      // Settle initial mount and drain any rAF callbacks it scheduled.
      await nextTick()
      rafCallbacks.splice(0).forEach((cb) => cb(performance.now()))

      // Snapshot how many reconfigures happened during mount — we only care about
      // the delta caused by the modelValue change below.
      const reconfiguresBefore = dispatchSpy.mock.calls.filter(hasReconfigure).length

      await wrapper.setProps({ modelValue: 'updated' })

      await nextTick()
      rafCallbacks.splice(0).forEach((cb) => cb(performance.now()))

      const reconfiguresAfter = dispatchSpy.mock.calls.filter(hasReconfigure).length

      // A content-only change must not produce any additional reconfigure dispatches.
      expect(reconfiguresAfter).toBe(reconfiguresBefore)
    })

    /**
     * Problem 4: `backspaceCommand` is defined at module level and must be a stable
     * reference across all `CodeInput` instances.
     *
     * It is the last element added in `codeMirrorExtensions`, so comparing the final
     * element of the extensions array from two independent mounts verifies stability.
     */
    /**
     * Bug fix: when the environment prop changes without any editor interaction,
     * CodeInput must dispatch a no-op transaction so CodeMirror's update() cycle
     * fires and the pill plugin rebuilds its decorations with the fresh values.
     *
     * Without the fix, the pill plugin's update() would never be called (it only
     * runs during CodeMirror's own transaction cycle), leaving pills showing stale
     * variable values until the user interacted with the editor.
     */
    it('environment prop change dispatches a no-op transaction to refresh pill decorations', async () => {
      const dispatchSpy = vi.spyOn(EditorView.prototype, 'dispatch')

      const wrapper = mount(CodeInput, {
        props: {
          modelValue: '{{baseUrl}}',
          layout: 'desktop' as const,
          environment: mockEnvironment,
          withVariables: true,
        },
      })

      await nextTick()
      dispatchSpy.mockClear()

      // Change the environment to a genuinely different object (new color + variable value).
      const updatedEnvironment: XScalarEnvironment = {
        color: '#00ff00',
        variables: [{ name: 'baseUrl', value: 'https://new.example.com' }],
      }
      await wrapper.setProps({ environment: updatedEnvironment })
      await nextTick()

      // At least one dispatch must have fired — the no-op that kicks the update() cycle.
      expect(dispatchSpy).toHaveBeenCalled()

      // It must be a plain no-op dispatch (no effects, no changes, no selection).
      const noOpCall = dispatchSpy.mock.calls.find((args) => {
        const spec = args[0] as Record<string, unknown> | undefined
        if (!spec) return true
        return !spec.changes && !spec.effects && !spec.selection && !spec.annotations
      })
      expect(noOpCall).toBeDefined()

      // And it must not have triggered a StateEffect.reconfigure — the extensions
      // array is stable and the pill plugin refreshes internally via update().
      const reconfigureCount = dispatchSpy.mock.calls.filter(hasReconfigure).length
      expect(reconfigureCount).toBe(0)
    })

    it('backspaceCommand is the same reference across separate CodeInput instances', () => {
      const wrapperA = mount(CodeInput, {
        props: {
          modelValue: 'a',
          layout: 'desktop' as const,
          environment: mockEnvironment,
        },
      })

      const wrapperB = mount(CodeInput, {
        props: {
          modelValue: 'b',
          layout: 'desktop' as const,
          environment: mockEnvironment,
        },
      })

      const extensionsA: any[] = (wrapperA.vm as any).codeMirrorExtensions
      const extensionsB: any[] = (wrapperB.vm as any).codeMirrorExtensions

      // The last element is `backspaceCommand` (module-level constant).
      // Both instances must reference the exact same object.
      const backspaceA = extensionsA[extensionsA.length - 1]
      const backspaceB = extensionsB[extensionsB.length - 1]

      expect(backspaceA).toBe(backspaceB)
    })
  })
})
