import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import CodeInputLite from './CodeInputLite.vue'

const env: XScalarEnvironment = {
  color: '#ff0000',
  variables: [
    { name: 'baseUrl', value: 'https://api.example.com' },
    { name: 'apiKey', value: 'secret123' },
  ],
}

const mountInput = (props: Partial<InstanceType<typeof CodeInputLite>['$props']> = {}) =>
  mount(CodeInputLite, {
    attachTo: document.body,
    props: {
      modelValue: '',
      environment: env,
      ...props,
    } as InstanceType<typeof CodeInputLite>['$props'],
  })

describe('CodeInputLite', () => {
  it('renders the model value in the input', () => {
    const wrapper = mountInput({ modelValue: '/users' })
    const input = wrapper.get('input').element as HTMLInputElement
    expect(input.value).toBe('/users')
  })

  it('renders disabled mode as a read-only label', () => {
    const wrapper = mountInput({ modelValue: '/users', disabled: true })
    const label = wrapper.find('[data-testid="code-input-lite-disabled"]')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('/users')
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('shows the placeholder when the value is empty', () => {
    const wrapper = mountInput({ modelValue: '', placeholder: 'Enter a URL' })
    expect(wrapper.get('input').attributes('placeholder')).toBe('Enter a URL')
  })

  it('emits update:modelValue when the user types', async () => {
    const wrapper = mountInput({ modelValue: '' })
    const input = wrapper.get('input')
    await input.setValue('/foo')
    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect(events?.at(-1)).toEqual(['/foo'])
  })

  it('renders an environment pill for `{{baseUrl}}`', async () => {
    const wrapper = mountInput({ modelValue: '{{baseUrl}}/users' })
    await nextTick()
    const pill = wrapper.find('.scalar-pill')
    expect(pill.exists()).toBe(true)
    expect(pill.classes()).not.toContain('scalar-pill--context-fn')
    expect(pill.attributes('data-variable')).toBe('baseUrl')
    expect(pill.text()).toBe('{{baseUrl}}')
  })

  it('renders a context-function pill for `{{$guid}}`', async () => {
    const wrapper = mountInput({ modelValue: 'id={{$guid}}' })
    await nextTick()
    const pill = wrapper.find('.scalar-pill')
    expect(pill.exists()).toBe(true)
    expect(pill.classes()).toContain('scalar-pill--context-fn')
    expect(pill.attributes('data-variable')).toBe('$guid')
  })

  it('renders multiple pills in the same value', async () => {
    const wrapper = mountInput({ modelValue: '{{baseUrl}}/{{apiKey}}' })
    await nextTick()
    const pills = wrapper.findAll('.scalar-pill')
    expect(pills).toHaveLength(2)
    expect(pills[0]?.attributes('data-variable')).toBe('baseUrl')
    expect(pills[1]?.attributes('data-variable')).toBe('apiKey')
  })

  it('fades pills for variables that are not defined in the environment', async () => {
    const wrapper = mountInput({ modelValue: '{{missingVar}}' })
    await nextTick()
    const pill = wrapper.find('.scalar-pill')
    expect(pill.attributes('style')).toContain('opacity:0.5')
  })

  it('does not render pills when withVariables is false', async () => {
    const wrapper = mountInput({ modelValue: '{{baseUrl}}', withVariables: false })
    await nextTick()
    expect(wrapper.find('.scalar-pill').exists()).toBe(false)
  })

  it('escapes HTML in the rendered overlay', async () => {
    const wrapper = mountInput({ modelValue: '<script>alert(1)</script>' })
    await nextTick()
    const overlay = wrapper.find('.code-input-lite__overlay').element as HTMLDivElement
    expect(overlay.innerHTML).not.toContain('<script>')
    expect(overlay.textContent).toBe('<script>alert(1)</script>')
  })

  it('removes the matching `}}` pair on backspace', async () => {
    const wrapper = mountInput({ modelValue: '{{baseUrl}}' })
    const input = wrapper.get('input').element as HTMLInputElement
    input.value = '{{baseUrl}}'
    input.setSelectionRange(input.value.length, input.value.length)

    await wrapper.get('input').trigger('keydown', { key: 'Backspace' })

    expect(input.value).toBe('{{baseUrl')
    const events = wrapper.emitted('update:modelValue')
    expect(events?.at(-1)).toEqual(['{{baseUrl'])
  })

  it('falls through to native backspace when not preceded by `}}`', () => {
    const wrapper = mountInput({ modelValue: 'abc' })
    const event = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true })
    wrapper.get('input').element.dispatchEvent(event)
    // Native deletion is not simulated by jsdom, but we can assert that the
    // handler did not preventDefault for non-`}}` cases.
    expect(event.defaultPrevented).toBe(false)
  })

  it('emits submit on Enter', async () => {
    const wrapper = mountInput({ modelValue: '/users' })
    await wrapper.get('input').trigger('keydown', { key: 'Enter' })
    const events = wrapper.emitted('submit')
    expect(events).toBeTruthy()
    expect(events?.[0]?.[0]).toBe('/users')
  })

  it('still emits submit on Enter when disableEnter is true and prevents default', () => {
    const wrapper = mountInput({ modelValue: '/users', disableEnter: true })
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    wrapper.get('input').element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.emitted('submit')?.[0]?.[0]).toBe('/users')
  })

  it('emits blur with the current value', async () => {
    const wrapper = mountInput({ modelValue: '/users' })
    await wrapper.get('input').trigger('blur')
    const events = wrapper.emitted('blur')
    expect(events?.[0]?.[0]).toBe('/users')
  })

  it('opens the dropdown when the user types `{{`', async () => {
    const wrapper = mountInput({ modelValue: '' })
    const input = wrapper.get('input').element as HTMLInputElement
    input.value = '{{'
    input.setSelectionRange(2, 2)
    await wrapper.get('input').trigger('input')
    await nextTick()
    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(true)
  })

  it('does not open the dropdown in modal layout', async () => {
    const wrapper = mountInput({ modelValue: '', layout: 'modal' })
    const input = wrapper.get('input').element as HTMLInputElement
    input.value = '{{'
    input.setSelectionRange(2, 2)
    await wrapper.get('input').trigger('input')
    await nextTick()
    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(false)
  })

  it('closes the dropdown after the closing `}}`', async () => {
    const wrapper = mountInput({ modelValue: '' })
    const input = wrapper.get('input').element as HTMLInputElement
    input.value = '{{baseUrl}}'
    input.setSelectionRange(input.value.length, input.value.length)
    await wrapper.get('input').trigger('input')
    await nextTick()
    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(false)
  })

  it('exposes focus(), getValue(), setContent(), and cursorPosition()', () => {
    const wrapper = mountInput({ modelValue: 'hello' })
    const exposed = wrapper.vm as unknown as {
      focus: (pos?: 'start' | 'end' | number) => void
      getValue: () => string
      setContent: (s: string) => void
      cursorPosition: () => number | undefined
    }

    expect(exposed.getValue()).toBe('hello')

    exposed.setContent('world')
    expect(exposed.getValue()).toBe('world')

    exposed.focus('end')
    expect(exposed.cursorPosition()).toBe('world'.length)

    exposed.focus(2)
    expect(exposed.cursorPosition()).toBe(2)
  })

  it('does not re-emit update:modelValue when the input value is unchanged and alwaysEmitChange is false', async () => {
    const wrapper = mountInput({ modelValue: 'abc', alwaysEmitChange: false })
    const input = wrapper.get('input').element as HTMLInputElement
    input.value = 'abc'
    await wrapper.get('input').trigger('input')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('emits update:modelValue even when value is unchanged when alwaysEmitChange is true', async () => {
    const wrapper = mountInput({ modelValue: 'abc', alwaysEmitChange: true })
    const input = wrapper.get('input').element as HTMLInputElement
    input.value = 'abc'
    await wrapper.get('input').trigger('input')
    expect(wrapper.emitted('update:modelValue')?.length).toBe(1)
  })

  it('skips submit on blur when emitOnBlur is false', async () => {
    const wrapper = mountInput({ modelValue: '/users', emitOnBlur: false })
    await wrapper.get('input').trigger('blur')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.emitted('blur')).toBeTruthy()
  })

  it('navigates to the environment page when the dropdown asks to redirect', async () => {
    const wrapper = mountInput({ modelValue: '' })
    const input = wrapper.get('input').element as HTMLInputElement
    input.value = '{{'
    input.setSelectionRange(2, 2)
    await wrapper.get('input').trigger('input')
    await nextTick()

    const dropdown = wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' })
    expect(dropdown.exists()).toBe(true)
    dropdown.vm.$emit('redirect')
    expect(wrapper.emitted('navigate')?.[0]?.[0]).toEqual({
      page: 'document',
      path: 'environment',
    })
  })

  it('inserts the selected variable when the dropdown emits select', async () => {
    const wrapper = mountInput({ modelValue: '' })
    const input = wrapper.get('input').element as HTMLInputElement
    input.value = '{{base'
    input.setSelectionRange(input.value.length, input.value.length)
    await wrapper.get('input').trigger('input')
    await nextTick()

    const dropdown = wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' })
    dropdown.vm.$emit('select', 'baseUrl')

    expect(input.value).toBe('{{baseUrl}}')
    const events = wrapper.emitted('update:modelValue')
    expect(events?.at(-1)).toEqual(['{{baseUrl}}'])
  })

  it('intercepts arrow keys when the dropdown is open and does not submit', async () => {
    const wrapper = mountInput({ modelValue: '' })
    const input = wrapper.get('input').element as HTMLInputElement
    input.value = '{{'
    input.setSelectionRange(2, 2)
    await wrapper.get('input').trigger('input')
    await nextTick()

    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(true)

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true, bubbles: true })
    input.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('closes the dropdown on Escape and does not submit', async () => {
    const wrapper = mountInput({ modelValue: '' })
    const input = wrapper.get('input').element as HTMLInputElement
    input.value = '{{'
    input.setSelectionRange(2, 2)
    await wrapper.get('input').trigger('input')
    await nextTick()
    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(true)

    await wrapper.get('input').trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(false)
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('marks pills with character offsets so clicks can be forwarded', async () => {
    const wrapper = mountInput({ modelValue: 'pre {{baseUrl}}/users' })
    await nextTick()
    const pill = wrapper.find('.scalar-pill')
    expect(pill.exists()).toBe(true)
    expect(pill.attributes('data-pill-start')).toBe('4')
    expect(pill.attributes('data-pill-end')).toBe('15')
  })

  it('forwards pill clicks to the input, focusing and placing the caret after the pill', async () => {
    const wrapper = mountInput({ modelValue: '{{baseUrl}}/users' })
    await nextTick()
    const pill = wrapper.find('.scalar-pill')
    await pill.trigger('click')
    const input = wrapper.get('input').element as HTMLInputElement
    expect(document.activeElement).toBe(input)
    expect(input.selectionStart).toBe('{{baseUrl}}'.length)
  })

  it('does not mount pill tooltips before the user interacts', async () => {
    const wrapper = mountInput({ modelValue: '{{baseUrl}}' })
    await nextTick()
    const pill = wrapper.find('.scalar-pill').element as HTMLElement
    // No focus, no hover → tooltip Vue apps stay unmounted, so `useTooltip`
    // has not set aria-describedby on the pill yet.
    expect(pill.getAttribute('aria-describedby')).toBeNull()
  })

  it('attaches a hover tooltip to each pill once the input is focused', async () => {
    const wrapper = mountInput({ modelValue: '{{baseUrl}}' })
    await nextTick()
    await wrapper.get('input').trigger('focus')
    await nextTick()
    const pill = wrapper.find('.scalar-pill').element as HTMLElement
    expect(pill.getAttribute('aria-describedby')).toBeTruthy()
  })

  it('attaches a hover tooltip when the user hovers the overlay before focusing', async () => {
    const wrapper = mountInput({ modelValue: '{{baseUrl}}' })
    await nextTick()
    await wrapper.find('.code-input-lite__overlay').trigger('pointerover')
    await nextTick()
    const pill = wrapper.find('.scalar-pill').element as HTMLElement
    expect(pill.getAttribute('aria-describedby')).toBeTruthy()
  })

  it('does not attach pill tooltips in modal layout even after focus', async () => {
    const wrapper = mountInput({ modelValue: '{{baseUrl}}', layout: 'modal' })
    await nextTick()
    await wrapper.get('input').trigger('focus')
    await nextTick()
    const pill = wrapper.find('.scalar-pill').element as HTMLElement
    expect(pill.getAttribute('aria-describedby')).toBeNull()
  })

  describe('select-mode dispatch', () => {
    it('renders DataTableInputSelect when an enum is provided and forwards the values', () => {
      const wrapper = mountInput({
        modelValue: 'a',
        enum: ['a', 'b', 'c'],
      })
      const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
      expect(select.exists()).toBe(true)
      expect(select.props('value')).toEqual(['a', 'b', 'c'])
      expect(wrapper.find('input').exists()).toBe(false)
    })

    it('forwards the schema type as the select type when an enum is provided', () => {
      const wrapper = mountInput({
        modelValue: '1',
        enum: ['1', '2', '3'],
        type: 'integer',
      })
      const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
      expect(select.props('type')).toBe('integer')
    })

    it('picks the first non-null type for tuple schema types in enum mode', () => {
      const wrapper = mountInput({
        modelValue: 'x',
        enum: ['x', 'y'],
        type: ['null', 'string'],
      })
      const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
      expect(select.props('type')).toBe('string')
    })

    it('renders a boolean select with true/false when type is boolean', () => {
      const wrapper = mountInput({
        modelValue: 'true',
        type: 'boolean',
      })
      const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
      expect(select.exists()).toBe(true)
      expect(select.props('value')).toEqual(['true', 'false'])
    })

    it('includes null in the boolean select when nullable is true', () => {
      const wrapper = mountInput({
        modelValue: 'null',
        type: 'boolean',
        nullable: true,
      })
      const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
      expect(select.props('value')).toEqual(['true', 'false', 'null'])
    })

    it('renders a boolean select when type is a tuple containing boolean', () => {
      const wrapper = mountInput({
        modelValue: 'false',
        type: ['boolean', 'string'],
      })
      const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
      expect(select.exists()).toBe(true)
      expect(select.props('value')).toEqual(['true', 'false'])
    })

    it('prefers enum over boolean when both are set', () => {
      const wrapper = mountInput({
        modelValue: 'a',
        type: 'boolean',
        enum: ['a', 'b'],
      })
      const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
      // Enum wins — value array is the enum, not true/false
      expect(select.props('value')).toEqual(['a', 'b'])
    })

    it('renders an examples select when examples are provided and no enum/boolean apply', () => {
      const wrapper = mountInput({
        modelValue: 'foo',
        examples: ['foo', 'bar', 'baz'],
      })
      const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
      expect(select.exists()).toBe(true)
      expect(select.props('value')).toEqual(['foo', 'bar', 'baz'])
    })

    it('forwards the default prop into the select', () => {
      const wrapper = mountInput({
        modelValue: 'a',
        enum: ['a', 'b'],
        default: 'b',
      })
      const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
      expect(select.props('default')).toBe('b')
    })

    it('emits update:modelValue when the select reports a change', async () => {
      const wrapper = mountInput({
        modelValue: 'true',
        type: 'boolean',
      })
      const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
      await select.vm.$emit('update:modelValue', 'false')
      const events = wrapper.emitted('update:modelValue')
      expect(events?.at(-1)).toEqual(['false'])
    })

    it('falls back to the input editor when no select-mode props are set', () => {
      const wrapper = mountInput({
        modelValue: 'plain text',
      })
      expect(wrapper.findComponent({ name: 'DataTableInputSelect' }).exists()).toBe(false)
      expect(wrapper.find('input').exists()).toBe(true)
    })

    it('does not render a select when the enum array is empty', () => {
      const wrapper = mountInput({
        modelValue: 'plain',
        enum: [],
      })
      expect(wrapper.findComponent({ name: 'DataTableInputSelect' }).exists()).toBe(false)
      expect(wrapper.find('input').exists()).toBe(true)
    })

    it('does not render a select when the examples array is empty', () => {
      const wrapper = mountInput({
        modelValue: 'plain',
        examples: [],
      })
      expect(wrapper.findComponent({ name: 'DataTableInputSelect' }).exists()).toBe(false)
      expect(wrapper.find('input').exists()).toBe(true)
    })
  })

  describe('readOnly', () => {
    it('applies the native readonly attribute when readOnly is true', () => {
      const wrapper = mountInput({ modelValue: 'hello', readOnly: true })
      const input = wrapper.get('input').element as HTMLInputElement
      expect(input.readOnly).toBe(true)
    })

    it('does not set readonly by default', () => {
      const wrapper = mountInput({ modelValue: 'hello' })
      const input = wrapper.get('input').element as HTMLInputElement
      expect(input.readOnly).toBe(false)
    })

    it('skips the backspace `}}` shortcut so it does not bypass readonly', () => {
      const wrapper = mountInput({ modelValue: '{{baseUrl}}', readOnly: true })
      const input = wrapper.get('input').element as HTMLInputElement
      input.value = '{{baseUrl}}'
      input.setSelectionRange(input.value.length, input.value.length)

      const event = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true })
      input.dispatchEvent(event)

      // Our handler bails before preventDefault so the browser's readonly
      // semantics are preserved
      expect(event.defaultPrevented).toBe(false)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('linethrough', () => {
    it('applies a strike-through class to the disabled label when set', () => {
      const wrapper = mountInput({
        modelValue: 'overridden',
        disabled: true,
        linethrough: true,
      })
      const label = wrapper.find('[data-testid="code-input-lite-disabled"]')
      expect(label.classes()).toContain('line-through')
    })

    it('applies a strike-through class to the editor wrapper when set', () => {
      const wrapper = mountInput({
        modelValue: 'overridden',
        linethrough: true,
      })
      expect(wrapper.find('.code-input-lite').classes()).toContain('line-through')
    })
  })

  describe('serialization for non-string model values', () => {
    it('renders a number model value as its string form in the input', async () => {
      const wrapper = mountInput({ modelValue: 42 as unknown as string })
      await nextTick()
      const input = wrapper.get('input').element as HTMLInputElement
      expect(input.value).toBe('42')
    })

    it('renders a boolean model value as its string form in the input', async () => {
      const wrapper = mountInput({ modelValue: true as unknown as string })
      await nextTick()
      const input = wrapper.get('input').element as HTMLInputElement
      expect(input.value).toBe('true')
    })

    it('JSON-stringifies array model values', async () => {
      const wrapper = mountInput({ modelValue: ['a', 'b'] as unknown as string })
      await nextTick()
      const input = wrapper.get('input').element as HTMLInputElement
      expect(input.value).toBe('["a","b"]')
    })

    it('renders nullish model values as an empty string', async () => {
      const wrapper = mountInput({ modelValue: null as unknown as string })
      await nextTick()
      const input = wrapper.get('input').element as HTMLInputElement
      expect(input.value).toBe('')
    })
  })

  describe('slots', () => {
    it('renders the icon slot inside the editor wrapper', () => {
      const wrapper = mount(CodeInputLite, {
        attachTo: document.body,
        props: {
          modelValue: 'hello',
          environment: env,
        } as InstanceType<typeof CodeInputLite>['$props'],
        slots: {
          icon: '<button data-testid="trash" type="button">×</button>',
        },
      })
      expect(wrapper.find('[data-testid="trash"]').exists()).toBe(true)
    })

    it('renders the warning slot inside the editor wrapper', () => {
      const wrapper = mount(CodeInputLite, {
        attachTo: document.body,
        props: {
          modelValue: 'hello',
          environment: env,
        } as InstanceType<typeof CodeInputLite>['$props'],
        slots: {
          warning: '<span data-testid="warn">!</span>',
        },
      })
      expect(wrapper.find('[data-testid="warn"]').exists()).toBe(true)
    })
  })
})
