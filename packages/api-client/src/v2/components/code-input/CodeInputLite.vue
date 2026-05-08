<script lang="ts">
/**
 * CodeInputLite
 *
 * Single-line text input that renders `{{varname}}` matches as styled pills
 * and offers an environment-variable autocomplete dropdown when the user
 * types `{{`.
 *
 * Internally it pairs a native `<input>` (the source of truth — native cursor,
 * IME, selection, paste, undo) with an absolutely positioned overlay that
 * mirrors the value with pill spans on top.
 *
 * Pills are styled spans, not atomic widgets, so they must occupy the exact
 * horizontal space of their underlying `{{...}}` text. They can style
 * background, color, border-radius, and box-shadow freely; horizontal padding,
 * margins, and layout-affecting borders are off-limits.
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

const inputRef = useTemplateRef<HTMLInputElement>('inputRef')
const overlayRef = useTemplateRef<HTMLDivElement>('overlayRef')
const measureRef = useTemplateRef<HTMLSpanElement>('measureRef')
const dropdownRef = ref<InstanceType<
  typeof EnvironmentVariableDropdown
> | null>(null)

const isFocused = ref(false)

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

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

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
  if (!overlayRef.value || layout === 'modal') {
    return
  }
  const pills = overlayRef.value.querySelectorAll<HTMLElement>('.scalar-pill')
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

/**
 * Skip work when the resulting overlay HTML would be identical. The cache key
 * combines the inputs that affect rendering — we never rebuild the DOM unless
 * one of them actually changed.
 */
let lastOverlayKey: string | null = null

/**
 * The render key includes the data we read from `environment` for each pill so
 * that adding/removing/renaming a variable invalidates the cache. Without this
 * a pill could keep showing a stale tooltip value after the env updates.
 */
const renderKeyForEnvironment = (text: string): string => {
  if (!withVariables || !text.includes('{{')) {
    return ''
  }
  const regex = new RegExp(REGEX.VARIABLES.source, REGEX.VARIABLES.flags)
  let m: RegExpExecArray | null
  let key = ''
  while ((m = regex.exec(text)) !== null) {
    const name = m[1] ?? ''
    key += `|${name}=${lookupVariableValue(name) ?? ''}`
  }
  return key
}

const renderOverlay = (text: string): void => {
  if (!overlayRef.value) {
    return
  }

  const key = `${withVariables ? '1' : '0'}|${environment?.color || ''}|${text}|${renderKeyForEnvironment(text)}`
  if (key === lastOverlayKey) {
    return
  }
  lastOverlayKey = key

  teardownPillTooltips()

  // Fast path: no pill markers in the text → set textContent and skip the
  // regex/innerHTML pipeline entirely. Most table cell values (header keys,
  // query keys, plain values) hit this branch.
  if (!withVariables || text.length === 0 || !text.includes('{{')) {
    overlayRef.value.textContent = text
    return
  }

  const regex = new RegExp(REGEX.VARIABLES.source, REGEX.VARIABLES.flags)
  let lastIndex = 0
  let html = ''
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const start = match.index
    const end = start + match[0].length

    if (start > lastIndex) {
      html += escapeHtml(text.slice(lastIndex, start))
    }

    const variableName = match[1] ?? ''
    const isCtx = isContextFunctionName(variableName)
    const cls = isCtx ? 'scalar-pill scalar-pill--context-fn' : 'scalar-pill'
    const color = isCtx
      ? 'var(--scalar-color-3)'
      : environment?.color || 'var(--scalar-color-1)'
    const isUndefinedEnv =
      !isCtx && lookupVariableValue(variableName) === undefined
    const opacity = isUndefinedEnv ? 'opacity:0.5;' : ''

    // `data-pill-start` records the character offset of the pill so click
    // forwarding can place the input caret at the matching position.
    html += `<span class="${cls}" data-variable="${escapeHtml(variableName)}" data-pill-start="${start}" data-pill-end="${end}" style="--tw-bg-base: ${color};${opacity}">${escapeHtml(match[0])}</span>`

    lastIndex = end
  }

  if (lastIndex < text.length) {
    html += escapeHtml(text.slice(lastIndex))
  }

  overlayRef.value.innerHTML = html

  // Pills are rendered visually but tooltip apps stay unmounted until the
  // user actually engages with the input. `ensureTooltipsActive` flips this
  // on first focus / pointerover and remounts on subsequent rebuilds.
  if (tooltipsActive) {
    mountPillTooltips()
  }
}

/**
 * Idempotent: flips `tooltipsActive` on first call and mounts tooltips for
 * the pills currently in the overlay. Bound to focus + pointerover so the
 * first interaction (whichever comes first) wires hover behaviour.
 */
const ensureTooltipsActive = (): void => {
  if (tooltipsActive) {
    return
  }
  tooltipsActive = true
  mountPillTooltips()
}

watch(
  [() => modelValue, () => environment, () => withVariables],
  () => renderOverlay(serializeValue(modelValue)),
  { immediate: true, flush: 'post' },
)

// Keep the overlay scrolled in lock-step with the input
const syncScroll = (): void => {
  if (!inputRef.value || !overlayRef.value) {
    return
  }
  overlayRef.value.scrollLeft = inputRef.value.scrollLeft
}

// ───────────────────────────────────────────────────────────────────
// Change / focus / blur
// ───────────────────────────────────────────────────────────────────

const emitChange = (value: string): void => {
  if (!alwaysEmitChange && value === serializeValue(modelValue)) {
    updateDropdownVisibility()
    return
  }
  emit('update:modelValue', value)
  renderOverlay(value)
  updateDropdownVisibility()
}

const handleInput = (event: Event): void => {
  emitChange((event.target as HTMLInputElement).value)
  syncScroll()
}

const handleInputFocus = (): void => {
  isFocused.value = true
  ensureTooltipsActive()
}

const handleInputBlur = (event: FocusEvent): void => {
  isFocused.value = false
  showDropdown.value = false
  const value = inputRef.value?.value ?? ''

  if (emitOnBlur && modelValue) {
    emit('submit', value, event)
  }

  emit('blur', value, event)
}

// ───────────────────────────────────────────────────────────────────
// Caret pixel position (for anchoring the env-var dropdown)
// ───────────────────────────────────────────────────────────────────

const measureTextWidth = (textBefore: string): number => {
  if (!inputRef.value || !measureRef.value) {
    return 0
  }
  const cs = window.getComputedStyle(inputRef.value)
  measureRef.value.style.font = cs.font
  measureRef.value.style.letterSpacing = cs.letterSpacing
  measureRef.value.textContent = textBefore
  return measureRef.value.getBoundingClientRect().width
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
  if (!inputRef.value) {
    return
  }

  const cursor = inputRef.value.selectionStart ?? 0
  const text = inputRef.value.value.slice(0, cursor)
  const lastOpen = text.lastIndexOf('{{')
  const lastClose = text.lastIndexOf('}}')

  if (lastOpen <= lastClose) {
    showDropdown.value = false
    return
  }

  dropdownQuery.value = text.slice(lastOpen + 2)
  showDropdown.value = true

  // Anchor the dropdown to the start of `{{`
  nextTick(() => {
    if (!inputRef.value) {
      return
    }
    const input = inputRef.value
    const anchorOffset =
      (input.selectionStart ?? 0) - dropdownQuery.value.length - 2
    const inputRect = input.getBoundingClientRect()
    const padLeft = Number.parseFloat(
      window.getComputedStyle(input).paddingLeft || '0',
    )
    const x = measureTextWidth(input.value.slice(0, anchorOffset))
    dropdownPosition.value = {
      left: inputRect.left + padLeft + x - input.scrollLeft,
      top: inputRect.bottom,
    }
  })
}

const handleDropdownSelect = (item: string): void => {
  if (!inputRef.value || readOnly) {
    return
  }

  const formatted = `{{${item}}}`
  const cursor = inputRef.value.selectionStart ?? 0
  const from = Math.max(0, cursor - dropdownQuery.value.length - 2)
  const to = cursor

  const value = inputRef.value.value
  const next = `${value.slice(0, from)}${formatted}${value.slice(to)}`
  const nextCursor = from + formatted.length

  inputRef.value.value = next
  inputRef.value.setSelectionRange(nextCursor, nextCursor)

  showDropdown.value = false
  emitChange(next)
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
    // `disableEnter` suppresses the browser's default (e.g. form submission)
    // but never blocks our @submit emission — consumers like the AddressBar
    // rely on Enter to commit the value while also preventing newline insertion.
    if (disableEnter) {
      event.preventDefault()
    }
    emit('submit', inputRef.value?.value ?? '', event)
    return
  }

  // Backspace deletes a `}}` pair as a unit so it mirrors the matching `{{`.
  // Skip when the input is readonly so we never bypass the native attribute.
  if (event.key === 'Backspace' && !readOnly && inputRef.value) {
    const input = inputRef.value
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? 0
    if (
      start === end &&
      start >= 2 &&
      input.value.slice(start - 2, start) === '}}'
    ) {
      event.preventDefault()
      const next = `${input.value.slice(0, start - 2)}${input.value.slice(start)}`
      input.value = next
      input.setSelectionRange(start - 2, start - 2)
      emitChange(next)
    }
  }
}

// The input is uncontrolled: we never bind `:value` to modelValue, because
// that would re-apply modelValue on every component re-render and overwrite
// internal mutations (backspace deletion, dropdown insertion, etc.). Instead
// we set the initial value on mount and reflect later prop changes via watch.
onMounted(() => {
  const initial = serializeValue(modelValue)
  if (inputRef.value && inputRef.value.value !== initial) {
    inputRef.value.value = initial
    renderOverlay(initial)
  }
})

watch(
  () => modelValue,
  (next) => {
    const serialized = serializeValue(next)
    if (inputRef.value && inputRef.value.value !== serialized) {
      inputRef.value.value = serialized
      syncScroll()
    }
  },
)

const handleSelect = (): void => {
  syncScroll()
  updateDropdownVisibility()
}

/**
 * Forward pill clicks to the input. Pills are interactive (so hover/focus
 * tooltips work), so clicks land on them instead of the input. Move focus
 * back to the input and place the caret right after the pill so typing picks
 * up where the user pointed.
 */
const handleOverlayClick = (event: MouseEvent): void => {
  const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
    '.scalar-pill',
  )
  if (!target || !inputRef.value) {
    return
  }
  const end = Number.parseInt(target.dataset.pillEnd ?? '', 10)
  inputRef.value.focus()
  if (Number.isFinite(end)) {
    inputRef.value.setSelectionRange(end, end)
  }
}

onBeforeUnmount(() => {
  teardownPillTooltips()
})

// ───────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────

defineExpose({
  /** Focus the input. `position` controls caret placement. */
  focus: (position?: 'start' | 'end' | number): void => {
    if (!inputRef.value) {
      return
    }
    inputRef.value.focus()
    if (!isDefined(position)) {
      return
    }
    const length = inputRef.value.value.length
    const pos =
      position === 'start' ? 0 : position === 'end' ? length : position
    inputRef.value.setSelectionRange(pos, pos)
  },
  /** Replace the current value programmatically and re-render the overlay. */
  setContent: (next = ''): void => {
    if (!inputRef.value || inputRef.value.value === next) {
      return
    }
    inputRef.value.value = next
    renderOverlay(next)
    syncScroll()
  },
  /** Read the current input value. */
  getValue: (): string => inputRef.value?.value ?? '',
  /** Caret offset in the input value. */
  cursorPosition: (): number | undefined =>
    inputRef.value?.selectionStart ?? undefined,
  isFocused,
  inputRef,
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
      'line-through': linethrough,
    }">
    <div
      ref="overlayRef"
      aria-hidden="true"
      class="code-input-lite__overlay"
      @click="handleOverlayClick"
      @pointerover="ensureTooltipsActive" />

    <span
      ref="measureRef"
      aria-hidden="true"
      class="code-input-lite__measure" />

    <input
      ref="inputRef"
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
      :aria-required="required ? 'true' : undefined"
      autocapitalize="off"
      autocomplete="off"
      autocorrect="off"
      class="code-input-lite__input"
      :placeholder="placeholder"
      :readonly="readOnly || undefined"
      :role="withVariables ? 'combobox' : undefined"
      spellcheck="false"
      type="text"
      @blur="handleInputBlur"
      @focus="handleInputFocus"
      @input="handleInput"
      @keydown="handleKeyDown"
      @scroll="syncScroll"
      @select="handleSelect" />

    <!-- Warning slot (positioned absolutely) -->
    <div
      v-if="$slots.warning"
      class="centered-y text-orange absolute right-7 text-xs">
      <slot name="warning" />
    </div>

    <!-- Icon slot (positioned absolutely) -->
    <div
      v-if="$slots.icon"
      class="centered-y absolute right-0 flex h-full items-center p-1.5 group-has-[.code-input-lite__input:focus-visible]:z-1">
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
}

.code-input-lite__input,
.code-input-lite__overlay {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  /* Identical box model so the overlay aligns character-for-character with the input */
  box-sizing: border-box;
  padding: 8px 0;
  margin: 0;
  border: 0;
  white-space: pre;
}

.code-input-lite__overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  color: var(--scalar-color-1);
}

.code-input-lite__input {
  position: relative;
  width: 100%;
  background: transparent;
  outline: none;
  /* Hide the input's own text — visible text comes from the overlay. The
     caret stays visible via caret-color. */
  color: transparent;
  caret-color: var(--scalar-color-1);
}

.code-input-lite__input::selection {
  background: var(--scalar-background-3);
  color: transparent;
}

.code-input-lite__input::placeholder {
  color: var(--scalar-color-3);
}

.code-input-lite__measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  white-space: pre;
  top: 0;
  left: 0;
}

.code-input-lite--error .code-input-lite__input {
  outline: 1px solid var(--scalar-color-red);
}
</style>

<style>
/*
  Pill styling for the overlay. Pills must occupy the same horizontal space as
  their underlying `{{name}}` text — no horizontal padding, margins, or
  layout-affecting borders. Use background, color, border-radius, and
  box-shadow for any visual treatment.
*/
.scalar-pill {
  color: var(--scalar-color-1);
  border-radius: 30px;
  display: inline;
  font-size: inherit;
  background: var(--scalar-background-3);
  /* Pills are interactive so the per-pill tooltip can attach hover/focus
     listeners. The rest of the overlay remains inert via pointer-events: none
     on `.code-input-lite__overlay`, and our @click handler forwards focus + caret
     position back to the input. */
  pointer-events: auto;
  cursor: text;
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
  /* box-shadow stands in for the dashed border so it does not change layout */
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
