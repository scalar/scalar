import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import CodeInputLite from './CodeInputLite.vue'

// The component anchors its autocomplete dropdown by reading the caret rect
// via `range.getBoundingClientRect()`. jsdom does not implement that method
// on Range, which causes the dropdown-positioning nextTick callback to throw
// an unhandled rejection. Provide a zero-rect stub so the async path resolves
// cleanly during tests; the component's own fallback then anchors the
// dropdown to the editor's bounding rect.
if (typeof Range !== 'undefined' && typeof Range.prototype.getBoundingClientRect !== 'function') {
  Range.prototype.getBoundingClientRect = (): DOMRect =>
    ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      toJSON: () => ({}),
    }) as DOMRect
}

// `attachTo: document.body` keeps the wrappers mounted across tests, so any
// teleported dropdown (rendered into the body) leaks into later assertions
// that use `document.querySelectorAll(...)`. Auto-unmount each wrapper after
// every test so the DOM starts clean every time.
enableAutoUnmount(afterEach)

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

// Helper to access the component's exposed API in a typed way.
type ExposedApi = {
  focus: (pos?: 'start' | 'end' | number) => void
  getValue: () => string
  setContent: (s: string) => void
  cursorPosition: () => number | undefined
}
const api = (wrapper: ReturnType<typeof mountInput>) => wrapper.vm as unknown as ExposedApi

describe('CodeInputLite', () => {
  it('renders the model value in the input', async () => {
    const wrapper = mountInput({ modelValue: '/users' })
    await nextTick()
    expect(api(wrapper).getValue()).toBe('/users')
    const editor = wrapper.get('.code-input-lite__editor').element as HTMLDivElement
    expect(editor.textContent).toBe('/users')
  })

  it('renders disabled mode as a read-only label', () => {
    const wrapper = mountInput({ modelValue: '/users', disabled: true })
    const label = wrapper.find('[data-testid="code-input-lite-disabled"]')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('/users')
    expect(wrapper.find('.code-input-lite__editor').exists()).toBe(false)
  })

  it('shows the placeholder when the value is empty', () => {
    const wrapper = mountInput({ modelValue: '', placeholder: 'Enter a URL' })
    const editor = wrapper.get('.code-input-lite__editor')
    expect(editor.attributes('data-placeholder')).toBe('Enter a URL')
    expect(wrapper.find('.code-input-lite').classes()).toContain('code-input-lite--empty')
  })

  it('emits update:modelValue when the user types', async () => {
    const wrapper = mountInput({ modelValue: '' })
    const editor = wrapper.find('.code-input-lite__editor')
    ;(editor.element as HTMLDivElement).textContent = '/foo'
    await editor.trigger('input')
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
    // `contentEditable` is set as a JS property (`el.contentEditable = 'false'`),
    // which jsdom does not reflect to the attribute; read the property directly.
    expect((pill.element as HTMLElement).contentEditable).toBe('false')
    // Pills now render just the variable name; the `{{` / `}}` markers only
    // exist in the model string returned by `getValue()`.
    expect(pill.text()).toBe('baseUrl')
  })

  it('renders a context-function pill for `{{$guid}}`', async () => {
    const wrapper = mountInput({ modelValue: 'id={{$guid}}' })
    await nextTick()
    const pill = wrapper.find('.scalar-pill')
    expect(pill.exists()).toBe(true)
    expect(pill.classes()).toContain('scalar-pill--context-fn')
    expect(pill.attributes('data-variable')).toBe('$guid')
    expect(pill.text()).toBe('$guid')
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
    expect(pill.attributes('style')).toMatch(/opacity:\s*0\.5/)
  })

  it('does not render pills when withVariables is false', async () => {
    const wrapper = mountInput({ modelValue: '{{baseUrl}}', withVariables: false })
    await nextTick()
    expect(wrapper.find('.scalar-pill').exists()).toBe(false)
    // With variables disabled, the model text is rendered literally.
    const editor = wrapper.get('.code-input-lite__editor').element as HTMLDivElement
    expect(editor.textContent).toBe('{{baseUrl}}')
  })

  it('renders HTML special characters in the model as literal text in the editor', async () => {
    const wrapper = mountInput({ modelValue: '<script>alert(1)</script>' })
    await nextTick()
    const editor = wrapper.find('.code-input-lite__editor').element as HTMLDivElement
    expect(editor.innerHTML).not.toContain('<script>')
    expect(editor.textContent).toBe('<script>alert(1)</script>')
  })

  it('renders pills as atomic, non-editable atoms so the browser deletes them as one unit', async () => {
    // The old `}}`-pair backspace shortcut was removed: pills are now
    // `contenteditable="false"`, which lets the browser handle deletion
    // atomically with no JS intercept.
    const wrapper = mountInput({ modelValue: '{{baseUrl}}' })
    await nextTick()
    const pill = wrapper.find('.scalar-pill')
    expect(pill.exists()).toBe(true)
    expect((pill.element as HTMLElement).contentEditable).toBe('false')
  })

  it('does not intercept native backspace handling', () => {
    const wrapper = mountInput({ modelValue: 'abc' })
    const event = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true })
    wrapper.get('.code-input-lite__editor').element.dispatchEvent(event)
    // The handler must not call preventDefault for plain Backspace — pill
    // atomicity is handled by `contenteditable="false"` on the pill itself.
    expect(event.defaultPrevented).toBe(false)
  })

  it('emits submit on Enter', async () => {
    const wrapper = mountInput({ modelValue: '/users' })
    await wrapper.get('.code-input-lite__editor').trigger('keydown', { key: 'Enter' })
    const events = wrapper.emitted('submit')
    expect(events).toBeTruthy()
    expect(events?.[0]?.[0]).toBe('/users')
  })

  it('still emits submit on Enter when disableEnter is true and prevents default', () => {
    const wrapper = mountInput({ modelValue: '/users', disableEnter: true })
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    wrapper.get('.code-input-lite__editor').element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.emitted('submit')?.[0]?.[0]).toBe('/users')
  })

  it('emits blur with the current value', async () => {
    const wrapper = mountInput({ modelValue: '/users' })
    await wrapper.get('.code-input-lite__editor').trigger('blur')
    const events = wrapper.emitted('blur')
    expect(events?.[0]?.[0]).toBe('/users')
  })

  it('opens the dropdown when the user types `{{`', async () => {
    const wrapper = mountInput({ modelValue: '' })
    api(wrapper).setContent('{{')
    api(wrapper).focus('end')
    await wrapper.get('.code-input-lite__editor').trigger('input')
    await nextTick()
    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(true)
  })

  it('does not open the dropdown in modal layout', async () => {
    const wrapper = mountInput({ modelValue: '', layout: 'modal' })
    api(wrapper).setContent('{{')
    api(wrapper).focus('end')
    await wrapper.get('.code-input-lite__editor').trigger('input')
    await nextTick()
    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(false)
  })

  it('does not open the dropdown when withVariables is false', async () => {
    const wrapper = mountInput({ modelValue: '', withVariables: false })
    api(wrapper).setContent('{{')
    api(wrapper).focus('end')
    await wrapper.get('.code-input-lite__editor').trigger('input')
    await nextTick()
    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(false)
  })

  it('does not open the dropdown when no environment is provided and fake data is off', async () => {
    const wrapper = mountInput({ modelValue: '', environment: undefined })
    api(wrapper).setContent('{{')
    api(wrapper).focus('end')
    await wrapper.get('.code-input-lite__editor').trigger('input')
    await nextTick()
    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(false)
  })

  it('closes the dropdown after the closing `}}`', async () => {
    const wrapper = mountInput({ modelValue: '' })
    api(wrapper).setContent('{{baseUrl}}')
    api(wrapper).focus('end')
    await wrapper.get('.code-input-lite__editor').trigger('input')
    await nextTick()
    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(false)
  })

  describe('combobox accessibility', () => {
    it('exposes combobox semantics on the editor when variables are enabled', () => {
      const editor = mountInput({ modelValue: '' }).get('.code-input-lite__editor')
      expect(editor.attributes('role')).toBe('combobox')
      expect(editor.attributes('aria-autocomplete')).toBe('list')
    })

    it('falls back to a plain textbox role when variables are disabled', () => {
      const editor = mountInput({ modelValue: '', withVariables: false }).get('.code-input-lite__editor')
      expect(editor.attributes('role')).toBe('textbox')
      expect(editor.attributes('aria-autocomplete')).toBeUndefined()
    })

    it('wires aria-controls and aria-activedescendant to a real listbox and option', async () => {
      const wrapper = mountInput({ modelValue: '' })
      api(wrapper).setContent('{{')
      api(wrapper).focus('end')
      await wrapper.get('.code-input-lite__editor').trigger('input')
      await nextTick()
      await nextTick()

      const editor = wrapper.get('.code-input-lite__editor')

      // aria-controls must reference an element that exists and is a listbox.
      const listboxId = editor.attributes('aria-controls')
      expect(listboxId).toBeTruthy()
      const listbox = document.getElementById(listboxId as string)
      expect(listbox?.getAttribute('role')).toBe('listbox')

      // Every row is exposed as an option.
      const options = listbox?.querySelectorAll('[role="option"]') ?? []
      expect(options.length).toBeGreaterThan(0)

      // aria-activedescendant must point at the highlighted, existing option.
      const activeId = editor.attributes('aria-activedescendant')
      expect(activeId).toBeTruthy()
      const activeOption = document.getElementById(activeId as string)
      expect(activeOption).not.toBeNull()
      expect(activeOption?.getAttribute('aria-selected')).toBe('true')
    })

    it('does not set aria-controls or aria-activedescendant while the dropdown is closed', () => {
      const editor = mountInput({ modelValue: '/users' }).get('.code-input-lite__editor')
      expect(editor.attributes('aria-controls')).toBeUndefined()
      expect(editor.attributes('aria-activedescendant')).toBeUndefined()
    })
  })

  it('exposes focus(), getValue(), setContent(), and cursorPosition()', () => {
    const wrapper = mountInput({ modelValue: 'hello' })
    const exposed = api(wrapper)

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
    await nextTick()
    // The editor is already populated with `abc` from the watcher/onMounted,
    // so dispatching an input event keeps the value unchanged.
    await wrapper.get('.code-input-lite__editor').trigger('input')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('emits update:modelValue even when value is unchanged when alwaysEmitChange is true', async () => {
    const wrapper = mountInput({ modelValue: 'abc', alwaysEmitChange: true })
    await nextTick()
    await wrapper.get('.code-input-lite__editor').trigger('input')
    expect(wrapper.emitted('update:modelValue')?.length).toBe(1)
  })

  it('skips submit on blur when emitOnBlur is false', async () => {
    const wrapper = mountInput({ modelValue: '/users', emitOnBlur: false })
    await wrapper.get('.code-input-lite__editor').trigger('blur')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.emitted('blur')).toBeTruthy()
  })

  it('does not emit submit on blur when the model value is empty', async () => {
    const wrapper = mountInput({ modelValue: '', emitOnBlur: true })
    await wrapper.get('.code-input-lite__editor').trigger('blur')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.emitted('blur')).toBeTruthy()
  })

  it('emits submit on blur for a falsy but non-empty model value like "0"', async () => {
    const wrapper = mountInput({ modelValue: '0', emitOnBlur: true })
    await nextTick()
    await wrapper.get('.code-input-lite__editor').trigger('blur')
    expect(wrapper.emitted('submit')?.[0]?.[0]).toBe('0')
  })

  it('navigates to the environment page when the dropdown asks to redirect', async () => {
    const wrapper = mountInput({ modelValue: '' })
    api(wrapper).setContent('{{')
    api(wrapper).focus('end')
    await wrapper.get('.code-input-lite__editor').trigger('input')
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
    api(wrapper).setContent('{{base')
    api(wrapper).focus('end')
    await wrapper.get('.code-input-lite__editor').trigger('input')
    await nextTick()

    const dropdown = wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' })
    dropdown.vm.$emit('select', 'baseUrl')

    expect(api(wrapper).getValue()).toBe('{{baseUrl}}')
    const events = wrapper.emitted('update:modelValue')
    expect(events?.at(-1)).toEqual(['{{baseUrl}}'])
  })

  it('intercepts arrow keys when the dropdown is open and does not submit', async () => {
    const wrapper = mountInput({ modelValue: '' })
    api(wrapper).setContent('{{')
    api(wrapper).focus('end')
    await wrapper.get('.code-input-lite__editor').trigger('input')
    await nextTick()

    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(true)

    const editor = wrapper.get('.code-input-lite__editor').element as HTMLDivElement
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true, bubbles: true })
    editor.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('opens the dropdown with the first item selected so Enter picks it immediately', async () => {
    const wrapper = mountInput({ modelValue: '' })
    api(wrapper).setContent('{{')
    api(wrapper).focus('end')
    await wrapper.get('.code-input-lite__editor').trigger('input')
    await nextTick()

    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(true)

    // The dropdown is teleported, so query the document body directly.
    const rows = Array.from(document.querySelectorAll('li')) as HTMLLIElement[]
    expect(rows.length).toBeGreaterThan(0)

    // The first row must be visibly highlighted as soon as the dropdown opens.
    expect(rows[0]?.classList.contains('bg-b-3')).toBe(true)

    // Hitting Enter without any arrow key navigation commits the first item.
    await wrapper.get('.code-input-lite__editor').trigger('keydown', { key: 'Enter' })
    await nextTick()
    const events = wrapper.emitted('update:modelValue')
    expect(events?.at(-1)?.[0]).toMatch(/^\{\{.+\}\}$/)
  })

  it('moves the dropdown selection on ArrowDown / ArrowUp', async () => {
    const wrapper = mountInput({ modelValue: '' })
    api(wrapper).setContent('{{')
    api(wrapper).focus('end')
    await wrapper.get('.code-input-lite__editor').trigger('input')
    await nextTick()

    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(true)
    const rows = Array.from(document.querySelectorAll('li')) as HTMLLIElement[]
    expect(rows.length).toBeGreaterThan(1)

    // Initially the first row is selected.
    expect(rows[0]?.classList.contains('bg-b-3')).toBe(true)

    // ArrowDown moves the highlight to the next row.
    await wrapper.get('.code-input-lite__editor').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(rows[0]?.classList.contains('bg-b-3')).toBe(false)
    expect(rows[1]?.classList.contains('bg-b-3')).toBe(true)

    // ArrowUp moves it back.
    await wrapper.get('.code-input-lite__editor').trigger('keydown', { key: 'ArrowUp' })
    await nextTick()
    expect(rows[0]?.classList.contains('bg-b-3')).toBe(true)
    expect(rows[1]?.classList.contains('bg-b-3')).toBe(false)
  })

  it('does not handle arrow keys when the dropdown is closed', async () => {
    const wrapper = mountInput({ modelValue: 'hello' })
    await nextTick()
    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(false)

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true, bubbles: true })
    ;(wrapper.get('.code-input-lite__editor').element as HTMLDivElement).dispatchEvent(event)
    // With the dropdown closed the handler must leave the event alone so the
    // browser keeps native caret behaviour and parents can react if they want.
    expect(event.defaultPrevented).toBe(false)
  })

  it('closes the dropdown on Escape and does not submit', async () => {
    const wrapper = mountInput({ modelValue: '' })
    api(wrapper).setContent('{{')
    api(wrapper).focus('end')
    await wrapper.get('.code-input-lite__editor').trigger('input')
    await nextTick()
    expect(wrapper.findComponent({ name: 'EnvironmentVariablesDropdown' }).exists()).toBe(true)

    await wrapper.get('.code-input-lite__editor').trigger('keydown', { key: 'Escape' })
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

  it('selects the whole pill on click so Backspace deletes it as one unit', async () => {
    const wrapper = mountInput({ modelValue: '{{baseUrl}}/users' })
    await nextTick()
    const pill = wrapper.find('.scalar-pill')
    await pill.trigger('click')
    const editor = wrapper.get('.code-input-lite__editor').element as HTMLDivElement
    expect(document.activeElement).toBe(editor)
    // The native selection should cover the pill's visible text exactly
    // (just the variable name — `{{` / `}}` only live in the model).
    const selection = window.getSelection()
    expect(selection?.toString()).toBe('baseUrl')
    expect(selection?.isCollapsed).toBe(false)
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
    await wrapper.get('.code-input-lite__editor').trigger('focus')
    await nextTick()
    const pill = wrapper.find('.scalar-pill').element as HTMLElement
    expect(pill.getAttribute('aria-describedby')).toBeTruthy()
  })

  it('attaches a hover tooltip when the user hovers the editor before focusing', async () => {
    const wrapper = mountInput({ modelValue: '{{baseUrl}}' })
    await nextTick()
    await wrapper.find('.code-input-lite__editor').trigger('pointerover')
    await nextTick()
    const pill = wrapper.find('.scalar-pill').element as HTMLElement
    expect(pill.getAttribute('aria-describedby')).toBeTruthy()
  })

  it('does not attach pill tooltips in modal layout even after focus', async () => {
    const wrapper = mountInput({ modelValue: '{{baseUrl}}', layout: 'modal' })
    await nextTick()
    await wrapper.get('.code-input-lite__editor').trigger('focus')
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
      expect(wrapper.find('.code-input-lite__editor').exists()).toBe(false)
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

    it('prefers the boolean select over examples when both are set', () => {
      const wrapper = mountInput({
        modelValue: 'true',
        type: 'boolean',
        examples: ['example1', 'example2'],
      })
      const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
      // Boolean wins — value array is true/false, not the examples
      expect(select.props('value')).toEqual(['true', 'false'])
    })

    it('prioritizes the disabled label over enum select mode', () => {
      const wrapper = mountInput({
        modelValue: 'a',
        disabled: true,
        enum: ['a', 'b', 'c'],
      })
      expect(wrapper.find('[data-testid="code-input-lite-disabled"]').exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'DataTableInputSelect' }).exists()).toBe(false)
    })

    it('falls back to string for a tuple type containing only null in enum mode', () => {
      const wrapper = mountInput({
        modelValue: 'x',
        enum: ['x', 'y'],
        type: ['null'],
      })
      const select = wrapper.findComponent({ name: 'DataTableInputSelect' })
      expect(select.props('type')).toBe('string')
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
      expect(wrapper.find('.code-input-lite__editor').exists()).toBe(true)
    })

    it('does not render a select when the enum array is empty', () => {
      const wrapper = mountInput({
        modelValue: 'plain',
        enum: [],
      })
      expect(wrapper.findComponent({ name: 'DataTableInputSelect' }).exists()).toBe(false)
      expect(wrapper.find('.code-input-lite__editor').exists()).toBe(true)
    })

    it('does not render a select when the examples array is empty', () => {
      const wrapper = mountInput({
        modelValue: 'plain',
        examples: [],
      })
      expect(wrapper.findComponent({ name: 'DataTableInputSelect' }).exists()).toBe(false)
      expect(wrapper.find('.code-input-lite__editor').exists()).toBe(true)
    })
  })

  describe('readOnly', () => {
    it('marks the editor as non-editable when readOnly is true', () => {
      const wrapper = mountInput({ modelValue: 'hello', readOnly: true })
      const editor = wrapper.get('.code-input-lite__editor')
      expect(editor.attributes('contenteditable')).toBe('false')
      expect(editor.attributes('aria-readonly')).toBe('true')
    })

    it('does not set readonly by default', () => {
      const wrapper = mountInput({ modelValue: 'hello' })
      const editor = wrapper.get('.code-input-lite__editor')
      expect(editor.attributes('contenteditable')).toBe('true')
      expect(editor.attributes('aria-readonly')).toBeUndefined()
    })

    it('does not allow edits when readOnly is true: the editor contenteditable is "false"', () => {
      // The old `}}`-backspace shortcut is gone — pills are atomic via
      // `contenteditable="false"` and the entire editor is also non-editable
      // in readOnly mode, so no keyboard shortcut can bypass the read-only
      // semantics.
      const wrapper = mountInput({ modelValue: '{{baseUrl}}', readOnly: true })
      const editor = wrapper.get('.code-input-lite__editor')
      expect(editor.attributes('contenteditable')).toBe('false')

      const event = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true })
      ;(editor.element as HTMLDivElement).dispatchEvent(event)
      // Our handler does not preventDefault on Backspace — the browser's
      // contenteditable=false semantics are what guarantees read-only.
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

  describe('error state', () => {
    it('applies the error class and aria-invalid when error is true', () => {
      const wrapper = mountInput({ modelValue: 'test', error: true })
      expect(wrapper.find('.code-input-lite').classes()).toContain('code-input-lite--error')
      expect(wrapper.get('.code-input-lite__editor').attributes('aria-invalid')).toBe('true')
    })

    it('does not apply error styling by default', () => {
      const wrapper = mountInput({ modelValue: 'test' })
      expect(wrapper.find('.code-input-lite').classes()).not.toContain('code-input-lite--error')
      expect(wrapper.get('.code-input-lite__editor').attributes('aria-invalid')).toBeUndefined()
    })
  })

  describe('component id', () => {
    it('uses a consumer-supplied id attribute on the editor wrapper', () => {
      const wrapper = mount(CodeInputLite, {
        attachTo: document.body,
        props: {
          modelValue: 'test',
          environment: env,
        } as InstanceType<typeof CodeInputLite>['$props'],
        attrs: { id: 'custom-id' },
      })
      expect(wrapper.find('#custom-id').exists()).toBe(true)
    })

    it('does not assign an id to the editor wrapper before the first focus', () => {
      const wrapper = mountInput({ modelValue: 'test' })
      expect(wrapper.find('.code-input-lite').attributes('id')).toBeUndefined()
    })

    it('generates an id once the editor is focused', async () => {
      const wrapper = mountInput({ modelValue: 'test' })
      await wrapper.get('.code-input-lite__editor').trigger('focus')
      await nextTick()
      expect(wrapper.find('.code-input-lite').attributes('id')).toMatch(/^id-/)
    })
  })

  describe('serialization for non-string model values', () => {
    it('renders a number model value as its string form in the editor', async () => {
      const wrapper = mountInput({ modelValue: 42 as unknown as string })
      await nextTick()
      expect(api(wrapper).getValue()).toBe('42')
    })

    it('renders a zero model value as "0"', async () => {
      const wrapper = mountInput({ modelValue: 0 as unknown as string })
      await nextTick()
      expect(api(wrapper).getValue()).toBe('0')
    })

    it('renders a boolean model value as its string form in the editor', async () => {
      const wrapper = mountInput({ modelValue: true as unknown as string })
      await nextTick()
      expect(api(wrapper).getValue()).toBe('true')
    })

    it('JSON-stringifies array model values', async () => {
      const wrapper = mountInput({ modelValue: ['a', 'b'] as unknown as string })
      await nextTick()
      expect(api(wrapper).getValue()).toBe('["a","b"]')
    })

    it('renders nullish model values as an empty string', async () => {
      const wrapper = mountInput({ modelValue: null as unknown as string })
      await nextTick()
      expect(api(wrapper).getValue()).toBe('')
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

  describe('required indicator', () => {
    it('renders the required indicator when required is true', () => {
      const wrapper = mountInput({ modelValue: '', required: true })
      const indicator = wrapper.find('.required')
      expect(indicator.exists()).toBe(true)
      expect(indicator.text()).toBe('Required')
    })

    it('sets aria-required on the editor when required is true', () => {
      const wrapper = mountInput({ modelValue: '', required: true })
      expect(wrapper.get('.code-input-lite__editor').attributes('aria-required')).toBe('true')
    })

    it('does not render the required indicator when required is false', () => {
      const wrapper = mountInput({ modelValue: '', required: false })
      expect(wrapper.find('.required').exists()).toBe(false)
    })

    it('does not render the required indicator by default', () => {
      const wrapper = mountInput({ modelValue: '' })
      expect(wrapper.find('.required').exists()).toBe(false)
      expect(wrapper.get('.code-input-lite__editor').attributes('aria-required')).toBeUndefined()
    })

    it('hides the required indicator while the editor is focused', () => {
      // jsdom does not evaluate the Tailwind `peer-has-[...]` selector, so we
      // assert the focus-hiding class is wired up rather than the computed style.
      const wrapper = mountInput({ modelValue: '', required: true })
      expect(wrapper.find('.required').classes()).toContain('peer-has-[.code-input-lite__editor:focus]:opacity-0')
    })

    it('still renders the required indicator alongside select mode', () => {
      const wrapper = mountInput({
        modelValue: 'a',
        required: true,
        enum: ['a', 'b'],
      })
      // The indicator is a sibling of the mode wrappers so it shows in every mode.
      expect(wrapper.find('.required').exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'DataTableInputSelect' }).exists()).toBe(true)
    })
  })

  describe('autofocus', () => {
    it('focuses the editor on mount when the autofocus attribute is present', () => {
      const wrapper = mount(CodeInputLite, {
        attachTo: document.body,
        props: {
          modelValue: '',
          environment: env,
        } as InstanceType<typeof CodeInputLite>['$props'],
        attrs: { autofocus: '' },
      })
      const editor = wrapper.get('.code-input-lite__editor').element
      expect(document.activeElement).toBe(editor)
    })

    it('does not focus the editor on mount without the autofocus attribute', () => {
      const wrapper = mountInput({ modelValue: '' })
      const editor = wrapper.get('.code-input-lite__editor').element
      expect(document.activeElement).not.toBe(editor)
    })
  })
})
