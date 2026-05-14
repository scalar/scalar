<script lang="ts">
/**
 * CodeInputLite
 *
 * Single-line `contenteditable` editor that renders `{{varname}}` as atomic
 * pill spans (`contenteditable="false"`) and offers an env-variable
 * autocomplete on `{{`. The value is still exposed as a `{{name}}`-bearing
 * string via `update:modelValue`; DOM ↔ model conversion lives in
 * `renderModel` and `serializeEditor`.
 */
export default {
  inheritAttrs: false,
}
</script>

<script setup lang="ts">
import { isDefined } from '@scalar/helpers/array/is-defined'
import { REGEX } from '@scalar/helpers/regex/regex-helpers'
import {
  CONTEXT_FUNCTION_NAMES,
  getContextFunctionComment,
  isContextFunctionName,
  type ContextFunctionName,
} from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { nanoid } from 'nanoid'
import {
  computed,
  createApp,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  useTemplateRef,
  watch,
  type App,
} from 'vue'

import DataTableInputSelect from '@/v2/components/data-table/DataTableInputSelect.vue'
import EnvironmentVariableDropdown from '@/v2/features/environments/components/EnvironmentVariablesDropdown.vue'
import type { ClientLayout } from '@/v2/types/layout'

import type { CodeInputModelValue } from './CodeInput.vue'
import { buildPillContext } from './helpers/build-pill-context'
import { lookupVariableValue } from './helpers/lookup-variable-value'
import { pillSignature } from './helpers/pill-signature'
import { serializeValue } from './helpers/serialize-value'
import PillTooltipHost from './PillTooltipHost.vue'

type Props = {
  modelValue: CodeInputModelValue
  /** Environment for variable substitution. Pass undefined to disable env vars */
  environment: XScalarEnvironment | undefined
  /** Render as a non-interactive read-only label */
  disabled?: boolean
  /** Render the input with the native `readonly` attribute (still focusable, no edits) */
  readOnly?: boolean
  /** Show error styling */
  error?: boolean
  /** Layout context affects styling and dropdown visibility */
  layout?: ClientLayout
  /** Placeholder text for an empty input */
  placeholder?: string
  /** Show required indicator */
  required?: boolean
  /** Disable the Enter key (single-line submit) */
  disableEnter?: boolean
  /** Emit submit on blur */
  emitOnBlur?: boolean
  /** Render variable pills + show the autocomplete dropdown */
  withVariables?: boolean
  /** Include `{{$guid}}` etc. in the autocomplete dropdown */
  withFakeData?: boolean
  /** Always emit change events even if the value is unchanged */
  alwaysEmitChange?: boolean
  /** Strike-through styling for the input text (e.g. overridden values) */
  linethrough?: boolean
  /** Schema type — drives boolean select mode when `boolean` is included */
  type?: string | string[]
  /** Predefined enum values; when set the input is replaced by a select */
  enum?: string[]
  /** Example values; when set (and no enum/boolean) the input is replaced by a select */
  examples?: string[]
  /** Default value to suggest in select modes */
  default?: CodeInputModelValue
  /** Whether the boolean select includes a `null` option */
  nullable?: boolean
}

const {
  modelValue,
  environment,
  disabled = false,
  readOnly = false,
  error = false,
  layout = 'desktop',
  placeholder,
  required = false,
  disableEnter = false,
  emitOnBlur = true,
  alwaysEmitChange = false,
  withVariables = true,
  withFakeData = false,
  linethrough = false,
  type,
  enum: enumProp,
  examples,
  default: defaultProp,
  nullable = false,
} = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'submit': [value: string, event: KeyboardEvent | FocusEvent]
  'blur': [value: string, event: FocusEvent]
  'navigate': [route: { page: 'document'; path: 'environment' }]
}>()

const attrs = useAttrs() as { 'id'?: string; 'aria-label'?: string }

/**
 * The id only matters once the dropdown opens (`aria-controls` /
 * `aria-activedescendant`), so we defer `nanoid()` until first focus to
 * keep idle instances cheap. A consumer-supplied `id` attr is preserved.
 */
const generatedComponentId = ref<string | null>(null)
const componentId = computed(
  (): string | undefined => attrs.id ?? generatedComponentId.value ?? undefined,
)
const ensureComponentId = (): void => {
  if (!attrs.id && generatedComponentId.value === null) {
    generatedComponentId.value = `id-${nanoid()}`
  }
}

const editorRef = useTemplateRef<HTMLDivElement>('editorRef')
const dropdownRef = ref<InstanceType<
  typeof EnvironmentVariableDropdown
> | null>(null)

const isFocused = ref(false)
const isEmpty = ref(true)

// ───────────────────────────────────────────────────────────────────
// Rendering-mode detection (parity with CodeInput's select dispatch)
// ───────────────────────────────────────────────────────────────────

/** True when the schema type is exactly `boolean` (or includes it in a tuple type). */
const isBooleanMode = computed((): boolean => {
  if (enumProp?.length) {
    return false
  }
  return type === 'boolean' || (Array.isArray(type) && type.includes('boolean'))
})

const booleanOptions = computed((): string[] =>
  nullable ? ['true', 'false', 'null'] : ['true', 'false'],
)

/** Default type when the schema is a tuple — picks the first non-null entry. */
const defaultType = computed((): string | undefined => {
  if (Array.isArray(type)) {
    return type.find((t) => t !== 'null') ?? 'string'
  }
  return type
})

const handleSelectChange = (value: string): void =>
  emit('update:modelValue', value)

// ───────────────────────────────────────────────────────────────────
// Per-pill tooltip apps
// ───────────────────────────────────────────────────────────────────

let pillTooltipApps: App[] = []

/**
 * Per-pill tooltips are the heaviest part of the render (a Vue app +
 * `useTooltip` watch + listeners each), so we defer mounting them until
 * the first interaction (focus, pointerover, or dropdown open). Once on,
 * subsequent rebuilds remount tooltips for the new pills.
 */
let tooltipsActive = false

const teardownPillTooltips = (): void => {
  for (const app of pillTooltipApps) {
    app.unmount()
  }
  pillTooltipApps = []
}

const mountPillTooltips = (): void => {
  if (!editorRef.value || layout === 'modal') {
    return
  }
  const pills = editorRef.value.querySelectorAll<HTMLElement>('.scalar-pill')
  for (const pillEl of pills) {
    const variableName = pillEl.dataset.variable ?? ''
    const context = buildPillContext(variableName, environment)
    const app = createApp(PillTooltipHost, { context, target: pillEl })
    // PillTooltipHost is renderless; useTooltip attaches to `target` directly.
    app.mount(document.createElement('div'))
    pillTooltipApps.push(app)
  }
}

// ───────────────────────────────────────────────────────────────────
// DOM ↔ model conversion
// ───────────────────────────────────────────────────────────────────

/**
 * Build a pill `<span>` for the given variable. `contentEditable = 'false'`
 * makes the browser treat it as a single atom (arrow keys jump over it,
 * Backspace deletes it whole); `{{` / `}}` only live in the model string.
 */
const createPillElement = (
  name: string,
  start: number,
  end: number,
): HTMLSpanElement => {
  const isCtx = isContextFunctionName(name)
  const span = document.createElement('span')
  span.className = isCtx ? 'scalar-pill scalar-pill--context-fn' : 'scalar-pill'
  span.contentEditable = 'false'
  span.dataset.variable = name
  // Model-coordinate offsets (the pill stands in for the full `{{name}}`).
  // Used by click forwarding and tests to map a pill back to the value.
  span.dataset.pillStart = String(start)
  span.dataset.pillEnd = String(end)

  const color = isCtx
    ? 'var(--scalar-color-3)'
    : environment?.color || 'var(--scalar-color-1)'
  span.style.setProperty('--tw-bg-base', color)

  const isUndefinedEnv =
    !isCtx && lookupVariableValue(environment, name) === undefined
  if (isUndefinedEnv) {
    span.style.opacity = '0.5'
  }

  span.textContent = name
  return span
}

/** Render a model string into the editor as a mix of text nodes + pills. */
const renderModel = (text: string): void => {
  const editor = editorRef.value
  if (!editor) {
    return
  }

  teardownPillTooltips()
  editor.replaceChildren()

  if (!withVariables || !text.includes('{{')) {
    if (text) {
      editor.appendChild(document.createTextNode(text))
    }
    isEmpty.value = text.length === 0
    return
  }

  const regex = new RegExp(REGEX.VARIABLES.source, REGEX.VARIABLES.flags)
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const start = match.index
    const end = start + match[0].length
    if (start > lastIndex) {
      editor.appendChild(document.createTextNode(text.slice(lastIndex, start)))
    }
    editor.appendChild(createPillElement(match[1] ?? '', start, end))
    lastIndex = end
  }

  if (lastIndex < text.length) {
    editor.appendChild(document.createTextNode(text.slice(lastIndex)))
  }

  isEmpty.value = false
  if (tooltipsActive) {
    mountPillTooltips()
  }
}

/** Length the given child contributes to the serialized model string. */
const modelLengthOf = (node: Node): number => {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').length
  }
  if (node instanceof HTMLElement && node.classList.contains('scalar-pill')) {
    return `{{${node.dataset.variable ?? ''}}}`.length
  }
  // Defensive: a stray element (e.g. browser-inserted <br>) — use its text.
  return (node.textContent ?? '').length
}

/** Read the editor DOM back into a `{{name}}`-bearing model string. */
const serializeEditor = (): string => {
  const editor = editorRef.value
  if (!editor) {
    return ''
  }
  let out = ''
  for (const node of Array.from(editor.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? ''
    } else if (
      node instanceof HTMLElement &&
      node.classList.contains('scalar-pill')
    ) {
      out += `{{${node.dataset.variable ?? ''}}}`
    } else if (node instanceof HTMLElement) {
      // Flatten any stray <br> / <div> the browser may inject on paste/Enter.
      out += node.textContent ?? ''
    }
  }
  return out
}

let lastPillSignature: string | null = null
let lastEnvKey = ''

/**
 * Cache key for the env + `withVariables` state. Includes variable
 * name/value pairs so the watcher notices adds/removes/edits even when
 * `environment.color` is unchanged — without that, pills keep stale
 * `isDefined` opacity and tooltip values until the input itself changes.
 */
const computeEnvKey = (): string => {
  const color = environment?.color ?? ''
  const flag = withVariables ? '1' : '0'
  const variables = environment?.variables ?? []
  let vars = ''
  for (const v of variables) {
    const value =
      typeof v.value === 'string' ? v.value : (v.value?.default ?? '')
    // Unit separators (\x1f / \x1e) so values can safely contain `|` or `=`.
    vars += `\x1f${v.name}\x1e${value}`
  }
  return `${color}|${flag}|${vars}`
}

/** Idempotent: first call flips `tooltipsActive` and mounts pill tooltips. */
const ensureTooltipsActive = (): void => {
  if (tooltipsActive) {
    return
  }
  tooltipsActive = true
  mountPillTooltips()
}

// ───────────────────────────────────────────────────────────────────
// Caret ↔ model offset
// ───────────────────────────────────────────────────────────────────

/** Selection start as a model-string offset, or `null` if not inside the editor. */
const getModelCaret = (): number | null => {
  const editor = editorRef.value
  if (!editor) {
    return null
  }
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return null
  }
  const range = selection.getRangeAt(0)
  if (
    range.startContainer !== editor &&
    !editor.contains(range.startContainer)
  ) {
    return null
  }

  // Anchored on the editor itself: `startOffset` is a child index.
  if (range.startContainer === editor) {
    let pos = 0
    for (
      let i = 0;
      i < range.startOffset && i < editor.childNodes.length;
      i++
    ) {
      pos += modelLengthOf(editor.childNodes[i] as Node)
    }
    return pos
  }

  let pos = 0
  for (const child of Array.from(editor.childNodes)) {
    if (child === range.startContainer) {
      return pos + range.startOffset
    }
    // Pills are non-editable; if a browser quirk still lands a selection
    // inside one, snap to the nearest boundary instead of getting stuck.
    if (child.contains(range.startContainer)) {
      return range.startOffset === 0 ? pos : pos + modelLengthOf(child)
    }
    pos += modelLengthOf(child)
  }
  return pos
}

/** Place the caret at the given model offset, walking the DOM to find it. */
const setModelCaret = (target: number): void => {
  const editor = editorRef.value
  if (!editor) {
    return
  }
  const range = document.createRange()
  let pos = 0
  let placed = false

  for (const child of Array.from(editor.childNodes)) {
    const len = modelLengthOf(child)
    if (pos + len >= target) {
      if (child.nodeType === Node.TEXT_NODE) {
        const into = Math.max(
          0,
          Math.min(target - pos, (child.textContent ?? '').length),
        )
        range.setStart(child, into)
      } else if (target - pos <= 0) {
        range.setStartBefore(child)
      } else {
        range.setStartAfter(child)
      }
      placed = true
      break
    }
    pos += len
  }

  if (!placed) {
    range.selectNodeContents(editor)
    range.collapse(false)
  } else {
    range.collapse(true)
  }

  const selection = window.getSelection()
  if (!selection) {
    return
  }
  selection.removeAllRanges()
  selection.addRange(range)
}

// ───────────────────────────────────────────────────────────────────
// Environment variable dropdown
// ───────────────────────────────────────────────────────────────────

const showDropdown = ref(false)
const dropdownQuery = ref('')
const dropdownPosition = ref({ left: 0, top: 0 })

const contextFunctionDropdownItems = computed(() =>
  withFakeData
    ? CONTEXT_FUNCTION_NAMES.map((key) => ({
        key,
        description: getContextFunctionComment(key as ContextFunctionName),
      }))
    : [],
)

const displayVariablesDropdown = computed(
  (): boolean =>
    showDropdown.value &&
    withVariables &&
    layout !== 'modal' &&
    (Boolean(environment) || withFakeData),
)

const updateDropdownVisibility = (): void => {
  const editor = editorRef.value
  if (!editor) {
    return
  }
  const caret = getModelCaret()
  if (caret === null) {
    showDropdown.value = false
    return
  }
  const text = serializeEditor().slice(0, caret)
  const lastOpen = text.lastIndexOf('{{')
  const lastClose = text.lastIndexOf('}}')

  if (lastOpen <= lastClose) {
    showDropdown.value = false
    return
  }

  dropdownQuery.value = text.slice(lastOpen + 2)
  showDropdown.value = true

  // Anchor under the caret; `getBoundingClientRect` gives the caret rect in one read.
  nextTick(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || !editorRef.value) {
      return
    }
    const r = selection.getRangeAt(0).cloneRange()
    r.collapse(true)
    const rect = r.getBoundingClientRect()
    const editorRect = editorRef.value.getBoundingClientRect()
    // Some browsers collapse empty ranges to a zero rect — fall back to the editor edge.
    dropdownPosition.value = {
      left: rect.left || editorRect.left,
      top: rect.bottom || editorRect.bottom,
    }
  })
}

const handleDropdownSelect = (item: string): void => {
  if (readOnly) {
    return
  }
  const caret = getModelCaret() ?? 0
  const value = serializeEditor()
  const from = Math.max(0, caret - dropdownQuery.value.length - 2)
  const to = caret
  const next = `${value.slice(0, from)}{{${item}}}${value.slice(to)}`
  const nextCursor = from + `{{${item}}}`.length

  // Pill set changed — force a re-render and reposition the caret.
  lastPillSignature = pillSignature(next, withVariables)
  renderModel(next)
  setModelCaret(nextCursor)

  showDropdown.value = false
  emitChange(next, { skipDropdownCheck: true })
}

// ───────────────────────────────────────────────────────────────────
// Change / focus / blur
// ───────────────────────────────────────────────────────────────────

const emitChange = (
  value: string,
  opts: { skipDropdownCheck?: boolean } = {},
): void => {
  const same = value === serializeValue(modelValue)
  if (alwaysEmitChange || !same) {
    emit('update:modelValue', value)
  }
  if (!opts.skipDropdownCheck) {
    updateDropdownVisibility()
  }
}

const handleInput = (): void => {
  const text = serializeEditor()
  isEmpty.value = text.length === 0

  // Only rebuild when the pill set changes (e.g. `}}` closed a pattern, or
  // a value was pasted). Skipping it for plain-text edits preserves the
  // live selection — important for IME composition and double-click select.
  const sig = pillSignature(text, withVariables)
  if (sig !== lastPillSignature) {
    const caret = getModelCaret()
    lastPillSignature = sig
    renderModel(text)
    if (caret !== null) {
      setModelCaret(caret)
    }
  }

  emitChange(text)
}

const handleFocus = (): void => {
  isFocused.value = true
  ensureComponentId()
  ensureTooltipsActive()
}

const handleBlur = (event: FocusEvent): void => {
  isFocused.value = false
  showDropdown.value = false
  const value = serializeEditor()
  if (emitOnBlur && modelValue) {
    emit('submit', value, event)
  }
  emit('blur', value, event)
}

/**
 * Strip rich content on paste; `contenteditable="plaintext-only"` is not
 * reliable cross-browser, so we intercept and use `insertText` to keep undo.
 */
const handlePaste = (event: ClipboardEvent): void => {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') ?? ''
  if (!text) {
    return
  }
  document.execCommand('insertText', false, text.replace(/\r?\n/g, ' '))
}

// ───────────────────────────────────────────────────────────────────
// Keyboard handling
// ───────────────────────────────────────────────────────────────────

const handleKeyDown = (event: KeyboardEvent): void => {
  if (showDropdown.value) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      event.stopPropagation()
      dropdownRef.value?.handleArrowKey(
        event.key === 'ArrowDown' ? 'down' : 'up',
      )
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      dropdownRef.value?.handleSelect()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      showDropdown.value = false
      return
    }
  }

  if (event.key === 'Enter') {
    // Block the browser default so a contenteditable div does not insert
    // <br> / <div> and break single-line semantics, then emit submit
    // (used by AddressBar / table editors). `disableEnter` is currently a
    // no-op beyond preventDefault — kept for API parity with CodeInput.
    event.preventDefault()
    void disableEnter
    emit('submit', serializeEditor(), event)
    return
  }

  // Backspace / Delete: pill atomicity is handled by the browser via
  // `contenteditable="false"` on pills — no manual `}}`-pair handling needed.
}

// ───────────────────────────────────────────────────────────────────
// Click forwarding & lifecycle
// ───────────────────────────────────────────────────────────────────

/**
 * Clicking a pill selects it whole, so a subsequent Backspace deletes it
 * in one keystroke and typing replaces it — the usual chip/mention model.
 */
const handleEditorClick = (event: MouseEvent): void => {
  const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
    '.scalar-pill',
  )
  if (!target) {
    return
  }
  const editor = editorRef.value
  if (!editor) {
    return
  }
  editor.focus()
  const range = document.createRange()
  range.selectNode(target)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  updateDropdownVisibility()
}

onMounted(() => {
  const initial = serializeValue(modelValue)
  lastPillSignature = pillSignature(initial, withVariables)
  lastEnvKey = computeEnvKey()
  renderModel(initial)
  isEmpty.value = initial.length === 0

  // `autofocus` on a contenteditable div is not honoured natively, so focus
  // the editor ourselves when the consumer passes the attribute.
  if (Object.hasOwn(attrs, 'autofocus')) {
    editorRef.value?.focus()
  }
})

watch(
  () => modelValue,
  (next) => {
    const serialized = serializeValue(next)
    if (serializeEditor() === serialized) {
      return
    }
    lastPillSignature = pillSignature(serialized, withVariables)
    renderModel(serialized)
    isEmpty.value = serialized.length === 0
  },
)

watch(
  [() => environment, () => withVariables],
  () => {
    // Env changes affect pill colour and `isDefined` opacity — rebuild.
    const envKey = computeEnvKey()
    if (envKey === lastEnvKey) {
      return
    }
    lastEnvKey = envKey
    // Most rows are plain text; skip the DOM walk when there are no pills.
    // Pills introduced later flow through `handleInput` / the modelValue
    // watcher, which update `lastPillSignature`.
    if (lastPillSignature === '') {
      return
    }
    lastPillSignature = pillSignature(serializeEditor(), withVariables)
    renderModel(serializeEditor())
  },
  // Variables are often mutated in place (e.g. editing a value in the env
  // editor) without the object reference changing — deep watch catches it.
  { deep: true },
)

onBeforeUnmount(() => {
  teardownPillTooltips()
})

// ───────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────

defineExpose({
  /** Focus the editor. `position` controls caret placement. */
  focus: (position?: 'start' | 'end' | number): void => {
    const editor = editorRef.value
    if (!editor) {
      return
    }
    editor.focus()
    if (!isDefined(position)) {
      return
    }
    const length = serializeEditor().length
    const pos =
      position === 'start' ? 0 : position === 'end' ? length : position
    setModelCaret(pos)
  },
  /** Replace the current value programmatically and re-render the pills. */
  setContent: (next = ''): void => {
    if (serializeEditor() === next) {
      return
    }
    lastPillSignature = pillSignature(next, withVariables)
    renderModel(next)
    isEmpty.value = next.length === 0
  },
  /** Read the current value as a `{{name}}`-bearing string. */
  getValue: (): string => serializeEditor(),
  /** Caret offset in the model string. */
  cursorPosition: (): number | undefined => {
    const c = getModelCaret()
    return c === null ? undefined : c
  },
  isFocused,
  editorRef,
})
</script>

<template>
  <!-- Disabled mode: read-only label -->
  <div
    v-if="disabled"
    class="text-c-2 flex cursor-default items-center justify-center"
    :class="{
      'font-code pr-2 pl-1 text-base': layout === 'modal',
      'px-2': layout !== 'modal',
      'line-through': linethrough,
    }"
    data-testid="code-input-lite-disabled">
    <span class="whitespace-nowrap">{{ modelValue }}</span>
  </div>

  <!-- Enum mode: select dropdown with predefined values -->
  <DataTableInputSelect
    v-else-if="enumProp?.length"
    :default="defaultProp"
    :modelValue="modelValue"
    :type="defaultType"
    :value="enumProp"
    @update:modelValue="handleSelectChange" />

  <!-- Boolean mode: select dropdown with true/false (and optionally null) -->
  <DataTableInputSelect
    v-else-if="isBooleanMode"
    :default="defaultProp"
    :modelValue="modelValue"
    :value="booleanOptions"
    @update:modelValue="handleSelectChange" />

  <!-- Examples mode: select dropdown with example values -->
  <DataTableInputSelect
    v-else-if="examples?.length"
    :default="defaultProp"
    :modelValue="modelValue"
    :value="examples"
    @update:modelValue="handleSelectChange" />

  <!-- Editor mode -->
  <div
    v-else
    :id="componentId"
    v-bind="$attrs"
    class="code-input-lite group/code-input-lite peer relative w-full leading-[1.44] -outline-offset-1 has-[:focus-visible]:rounded-[4px] has-[:focus-visible]:outline"
    :class="{
      'code-input-lite--error': error,
      'code-input-lite--empty': isEmpty,
      'line-through': linethrough,
    }">
    <!-- The single editable surface; see the file header for how pills work. -->
    <div
      ref="editorRef"
      :aria-activedescendant="
        displayVariablesDropdown ? `${componentId}-listbox` : undefined
      "
      :aria-autocomplete="withVariables ? 'list' : undefined"
      :aria-controls="
        displayVariablesDropdown ? `${componentId}-listbox` : undefined
      "
      :aria-expanded="displayVariablesDropdown ? 'true' : undefined"
      :aria-invalid="error ? 'true' : undefined"
      :aria-label="attrs['aria-label']"
      :aria-readonly="readOnly ? 'true' : undefined"
      :aria-required="required ? 'true' : undefined"
      class="code-input-lite__editor"
      :contenteditable="readOnly ? 'false' : 'true'"
      :data-placeholder="placeholder"
      :role="withVariables ? 'combobox' : 'textbox'"
      spellcheck="false"
      @blur="handleBlur"
      @click="handleEditorClick"
      @focus="handleFocus"
      @input="handleInput"
      @keydown="handleKeyDown"
      @paste="handlePaste"
      @pointerover="ensureTooltipsActive" />
  </div>

  <!--
    Slots and the required indicator are siblings of the mode templates so
    they render in every mode and so `absolute right-0` anchors to the
    surrounding (relative) cell rather than the shrink-wrapped mode wrapper.
  -->
  <div
    v-if="$slots.warning"
    class="centered-y text-orange absolute right-7 text-xs">
    <slot name="warning" />
  </div>
  <div
    v-if="$slots.icon"
    class="centered-y absolute right-0 flex h-full items-center p-1.5 group-has-[.code-input-lite__editor:focus]:z-1">
    <slot name="icon" />
  </div>
  <div
    v-if="required"
    class="required centered-y text-xxs text-c-3 group-[.error]:text-red bg-b-1 pointer-events-none absolute right-0 mr-0.5 pt-px pr-2 opacity-100 shadow-[-8px_0_4px_var(--scalar-background-1)] transition-opacity duration-150 peer-has-[.code-input-lite__editor:focus]:opacity-0">
    Required
  </div>

  <EnvironmentVariableDropdown
    v-if="displayVariablesDropdown"
    ref="dropdownRef"
    :contextFunctionItems="contextFunctionDropdownItems"
    :dropdownPosition="dropdownPosition"
    :environment="environment"
    :query="dropdownQuery"
    @redirect="emit('navigate', { page: 'document', path: 'environment' })"
    @select="handleDropdownSelect" />
</template>

<style scoped>
.code-input-lite {
  /* Flex so the editor centres vertically in whatever height the cell gives us.
     Font properties inherit so we adopt the surrounding typography. */
  display: flex;
  align-items: center;
}

.code-input-lite__editor {
  /* Everything font-related inherits from the surrounding context. */
  font: inherit;
  letter-spacing: inherit;
  flex: 1;
  min-width: 0;
  background: transparent;
  outline: none;
  color: var(--scalar-color-1);
  caret-color: var(--scalar-color-1);
  /* Single-line: horizontal scroll keeps the caret visible for long values;
     the scrollbar itself is hidden (would be noisy inside a table cell). */
  white-space: pre;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  padding: 0 0.5em;
  box-sizing: border-box;
  line-height: 1.44;
  /* Positioning context for the absolutely positioned placeholder. */
  position: relative;
}

.code-input-lite__editor::-webkit-scrollbar {
  display: none;
}

/* Absolute so the placeholder does not occupy flow space inside the
   contenteditable; otherwise the caret would land after it on focus.
   `pointer-events: none` lets clicks fall through to focus the editor. */
.code-input-lite--empty .code-input-lite__editor::before {
  content: attr(data-placeholder);
  color: var(--scalar-color-3);
  pointer-events: none;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0.5em;
  display: flex;
  align-items: center;
}

.code-input-lite--error .code-input-lite__editor {
  outline: 1px solid var(--scalar-color-red);
}
</style>

<style>
/* Pill styling. Each pill is `<span contenteditable="false">name</span>` —
   an atomic widget; the caret lands before or after it, never inside. */
.scalar-pill {
  color: var(--scalar-color-1);
  border-radius: 30px;
  display: inline-block;
  font-size: inherit;
  line-height: 1.4;
  vertical-align: baseline;
  background: var(--scalar-background-3);
  padding: 0 0.5em;
  cursor: text;
  /* Single click selects the whole pill — chip/mention model, deletes in one go. */
  user-select: all;
  -webkit-user-select: all;
}

.dark-mode .scalar-pill {
  background: color-mix(
    in srgb,
    var(--tw-bg-base, var(--scalar-color-1)),
    transparent 90%
  );
}

.light-mode .scalar-pill {
  background: var(--scalar-background-3);
}

.scalar-pill--context-fn {
  /* Inset box-shadow as a border so the layout box stays identical to plain pills. */
  box-shadow: 0 0 0 1px
    color-mix(in srgb, var(--scalar-color-3), transparent 35%) inset;
}

.dark-mode .scalar-pill--context-fn {
  background: color-mix(in srgb, var(--scalar-background-3), transparent 55%);
}

.light-mode .scalar-pill--context-fn {
  background: color-mix(in srgb, var(--scalar-background-3), transparent 40%);
}
</style>
