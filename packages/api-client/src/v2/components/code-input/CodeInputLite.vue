<script lang="ts">
/**
 * CodeInputLite
 *
 * Single-line editor that renders `{{varname}}` matches as atomic pill
 * widgets and offers an environment-variable autocomplete dropdown when the
 * user types `{{`.
 *
 * Internally it is a `contenteditable` div. Plain text lives in text nodes;
 * each `{{name}}` becomes a `<span contenteditable="false">name</span>` pill.
 * Because the pill is `contenteditable="false"`, the browser treats it as a
 * single atom: arrow keys jump over it, Backspace/Delete removes it as one
 * unit, and the caret can sit before or after it but never inside. The pill
 * therefore renders just the variable name (no `{{` / `}}` in the DOM) and
 * can carry whatever padding/border-radius it likes without breaking
 * cursor alignment, because there is no longer a hidden character-positioned
 * input to align against.
 *
 * The component still exposes the value as a plain `{{name}}`-bearing string
 * via `update:modelValue`; the DOM ↔ model conversion lives in `renderModel`
 * and `serializeEditor`.
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
import type { PillContext } from './pill-context'
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
const componentId = attrs.id || `id-${nanoid()}`

const editorRef = useTemplateRef<HTMLDivElement>('editorRef')
const dropdownRef = ref<InstanceType<
  typeof EnvironmentVariableDropdown
> | null>(null)

const isFocused = ref(false)
const isEmpty = ref(true)

// ───────────────────────────────────────────────────────────────────
// Rendering-mode detection (parity with CodeInput's select dispatch)
// ───────────────────────────────────────────────────────────────────

/** Convert any incoming model value to a string for the input element. */
const serializeValue = (value: CodeInputModelValue): string => {
  if (typeof value === 'string') {
    return value
  }
  if (value == null) {
    return ''
  }
  return JSON.stringify(value)
}

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
// Pill rendering
// ───────────────────────────────────────────────────────────────────

const lookupVariableValue = (name: string): string | undefined => {
  const v = environment?.variables?.find((x) => x.name === name)
  if (!v) {
    return undefined
  }
  return typeof v.value === 'string' ? v.value : v.value?.default
}

const buildPillContext = (variableName: string): PillContext => {
  if (isContextFunctionName(variableName)) {
    return {
      type: 'contextFunction',
      identifier: variableName,
      details: getContextFunctionComment(variableName as ContextFunctionName),
    }
  }
  const value = lookupVariableValue(variableName)
  return {
    type: 'environment',
    name: variableName,
    value: value || 'No value',
    isDefined: Boolean(value),
  }
}

// ───────────────────────────────────────────────────────────────────
// Per-pill tooltip apps
// ───────────────────────────────────────────────────────────────────

let pillTooltipApps: App[] = []

/**
 * Tooltips are the most expensive part of the render — each pill creates a
 * Vue app + a `useTooltip` watch + four DOM listeners. We defer that work
 * until the user actually interacts (focus, pointerover, or the autocomplete
 * dropdown opens) so a page full of idle instances costs nothing extra.
 *
 * Once `tooltipsActive` flips to true it stays on; subsequent overlay
 * rebuilds remount tooltips for the new pills as before.
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
    const context = buildPillContext(variableName)
    const app = createApp(PillTooltipHost, { context, target: pillEl })
    // Mount onto a throwaway container — PillTooltipHost is renderless and
    // the tooltip behaviour attaches to `target` directly via useTooltip.
    app.mount(document.createElement('div'))
    pillTooltipApps.push(app)
  }
}

// ───────────────────────────────────────────────────────────────────
// DOM ↔ model conversion
// ───────────────────────────────────────────────────────────────────

/**
 * Build a pill `<span>` for the given variable. `contentEditable = 'false'`
 * is what makes the browser treat the pill as a single atom: arrow keys jump
 * over it, Backspace removes it as a whole, and the caret can never land
 * inside. The visible text is just the variable name; `{{` / `}}` only live
 * in the serialized model string.
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
  // Offsets are in *model* coordinates (where the pill stands in for the
  // full `{{name}}` string). Kept around so click forwarding and tests can
  // map a pill back to its position in the emitted value.
  span.dataset.pillStart = String(start)
  span.dataset.pillEnd = String(end)

  const color = isCtx
    ? 'var(--scalar-color-3)'
    : environment?.color || 'var(--scalar-color-1)'
  span.style.setProperty('--tw-bg-base', color)

  const isUndefinedEnv = !isCtx && lookupVariableValue(name) === undefined
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
      // Browsers sometimes inject <br> or wrapper <div>s on paste / Enter;
      // flatten them by reading their text only.
      out += node.textContent ?? ''
    }
  }
  return out
}

/**
 * Structural signature: two values produce the same signature iff their
 * sequence of pills is identical. Plain-text edits that don't change the
 * pill set don't need a DOM rebuild, which preserves the live caret.
 */
const pillSignature = (text: string): string => {
  if (!withVariables || !text.includes('{{')) {
    return ''
  }
  const regex = new RegExp(REGEX.VARIABLES.source, REGEX.VARIABLES.flags)
  let sig = ''
  let m: RegExpExecArray | null
  while ((m = regex.exec(text)) !== null) {
    sig += `|${m[1] ?? ''}`
  }
  return sig
}

let lastPillSignature: string | null = null
let lastEnvKey = ''

/**
 * Idempotent: flips `tooltipsActive` on first call and mounts tooltips for
 * the pills currently in the editor. Bound to focus + pointerover so the
 * first interaction (whichever comes first) wires hover behaviour.
 */
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

/**
 * Offset of the current selection's start in the model string. Returns
 * `null` when there is no usable selection inside the editor.
 */
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

  // Anchored on the editor itself — `startOffset` is a child index.
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
    // Pills are `contenteditable=false` so the selection shouldn't end up
    // inside one. If it does (e.g. some browser quirk), snap to a sensible
    // boundary instead of getting stuck.
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

  // Anchor the dropdown beneath the current caret. `range.getBoundingClientRect`
  // gives us the precise caret rect for the cost of a single read.
  nextTick(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || !editorRef.value) {
      return
    }
    const r = selection.getRangeAt(0).cloneRange()
    r.collapse(true)
    const rect = r.getBoundingClientRect()
    const editorRect = editorRef.value.getBoundingClientRect()
    // An empty range collapses to a zero rect in some browsers; fall back to
    // the editor edge so the dropdown still appears somewhere reasonable.
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

  // The pill set changes — force a re-render and replace the caret.
  lastPillSignature = pillSignature(next)
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

  // Re-render only when the typed change affects the pill set — e.g. the
  // user typed `}}` to close a `{{name}}` pattern, or pasted a value. For
  // plain-text edits the DOM the browser produced is already correct, and
  // skipping the rebuild keeps the live selection intact (important for IME
  // composition and double-click word selection).
  const sig = pillSignature(text)
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
 * Strip rich content on paste — the editor is single-line plain text plus
 * pill atoms, never arbitrary HTML. `contenteditable="plaintext-only"`
 * would do the same but isn't supported reliably across browsers, so we
 * intercept paste manually and use `insertText` to honor undo.
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
    // Always block the browser's default Enter — a contenteditable div would
    // otherwise insert <br> / <div>, breaking single-line semantics. Submit
    // emission is independent and used by AddressBar / table editors.
    event.preventDefault()
    if (disableEnter) {
      // No-op besides preventDefault; matches the previous contract.
    }
    emit('submit', serializeEditor(), event)
    return
  }

  // Backspace / Delete: pill atomicity is handled by the browser thanks to
  // `contenteditable="false"` on pills — no manual `}}`-pair handling needed.
}

// ───────────────────────────────────────────────────────────────────
// Click forwarding & lifecycle
// ───────────────────────────────────────────────────────────────────

/**
 * Clicking a pill: anchor the caret right after it so typing continues
 * naturally. Real browsers usually do this for us when clicking a
 * `contenteditable=false` node, but doing it explicitly guarantees a
 * consistent caret position across browsers and matches the prior behaviour
 * (tests assert that clicking `{{baseUrl}}/users` places the caret at
 * offset 11).
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
  range.setStartAfter(target)
  range.collapse(true)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  updateDropdownVisibility()
}

onMounted(() => {
  const initial = serializeValue(modelValue)
  lastPillSignature = pillSignature(initial)
  lastEnvKey = `${environment?.color ?? ''}|${withVariables ? '1' : '0'}`
  renderModel(initial)
  isEmpty.value = initial.length === 0
})

watch(
  () => modelValue,
  (next) => {
    const serialized = serializeValue(next)
    if (serializeEditor() === serialized) {
      return
    }
    lastPillSignature = pillSignature(serialized)
    renderModel(serialized)
    isEmpty.value = serialized.length === 0
  },
)

watch([() => environment, () => withVariables], () => {
  // Env swaps change pill colors and "undefined" opacity — force a rebuild.
  const envKey = `${environment?.color ?? ''}|${withVariables ? '1' : '0'}`
  if (envKey === lastEnvKey) {
    return
  }
  lastEnvKey = envKey
  lastPillSignature = pillSignature(serializeEditor())
  renderModel(serializeEditor())
})

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
    lastPillSignature = pillSignature(next)
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
    class="code-input-lite group/code-input-lite font-code peer relative w-full text-xs leading-[1.44] -outline-offset-1 has-[:focus-visible]:rounded-[4px] has-[:focus-visible]:outline"
    :class="{
      'code-input-lite--error': error,
      'code-input-lite--empty': isEmpty,
      'line-through': linethrough,
    }">
    <!--
      Single editable surface. Plain text lives in text nodes; each
      `{{name}}` is rendered as a `<span contenteditable="false">` pill so
      the browser treats it as an atom (arrow keys hop over it, Backspace
      removes the whole thing, caret cannot enter). DOM ↔ model conversion
      happens in `renderModel` and `serializeEditor`.
    -->
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

    <!-- Warning slot (positioned absolutely) -->
    <div
      v-if="$slots.warning"
      class="centered-y text-orange absolute right-7 text-xs">
      <slot name="warning" />
    </div>

    <!-- Icon slot (positioned absolutely) -->
    <div
      v-if="$slots.icon"
      class="centered-y absolute right-0 flex h-full items-center p-1.5 group-has-[.code-input-lite__editor:focus]:z-1">
      <slot name="icon" />
    </div>

    <div
      v-if="required"
      class="required centered-y text-xxs text-c-3 group-[.error]:text-red bg-b-1 pointer-events-none absolute right-0 mr-0.5 pt-px pr-2 opacity-100 shadow-[-8px_0_4px_var(--scalar-background-1)] transition-opacity duration-150">
      Required
    </div>
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
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-small);
  /* Wrapper is a flex container so the editor can centre-align vertically
     within whatever height the parent cell gives us. */
  display: flex;
  align-items: center;
}

.code-input-lite__editor {
  /*
    `font: inherit` resets the UA font sub-properties; the explicit
    `font-size` then matches the CodeMirror baseline (`--scalar-small`),
    so this editor visually agrees with the heavy `CodeInput` sibling.
  */
  font: inherit;
  font-size: var(--scalar-small);
  letter-spacing: inherit;
  flex: 1;
  min-width: 0;
  background: transparent;
  outline: none;
  color: var(--scalar-color-1);
  caret-color: var(--scalar-color-1);
  /* Single-line semantics: no wrap, horizontal scroll keeps the caret
     visible for long values. The scrollbar itself is hidden — a CodeInputLite
     lives inside a table cell, where a chrome scrollbar would be noisy. */
  white-space: pre;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  padding: 0 0.5em;
  box-sizing: border-box;
  line-height: 1.44;
}

.code-input-lite__editor::-webkit-scrollbar {
  display: none;
}

/* Placeholder — a CSS pseudo-element on the empty editor. `pointer-events:
   none` so clicking through it still focuses the editor underneath. */
.code-input-lite--empty .code-input-lite__editor::before {
  content: attr(data-placeholder);
  color: var(--scalar-color-3);
  pointer-events: none;
}

.code-input-lite--error .code-input-lite__editor {
  outline: 1px solid var(--scalar-color-red);
}
</style>

<style>
/*
  Pill styling. Each pill is `<span contenteditable="false">name</span>` — an
  atomic widget in the editing surface. Because the pill no longer needs to
  match the width of any hidden underlying text, it can carry whatever
  horizontal padding it likes; the caret naturally lands before or after the
  pill rather than at a per-character position inside it.
*/
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
  /* `user-select: all` causes a single click on the pill to select it as a
     whole — matches the "pill is one block" mental model and gives a clear
     visual when the user is about to delete it. */
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
  /* Inset box-shadow stands in for a border so the pill's layout box doesn't
     change between context-fn pills and regular ones. */
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
