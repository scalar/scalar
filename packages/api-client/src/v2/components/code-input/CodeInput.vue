<script setup lang="ts">
import {
  colorPicker as colorPickerExtension,
  useCodeMirror,
  useDropdown,
  type CodeMirrorLanguage,
  type Extension,
} from '@scalar/use-codemirror'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { nanoid } from 'nanoid'
import { computed, ref, toRef, useAttrs, watch, type Ref } from 'vue'

import DataTableInputSelect from '@/v2/components/data-table/DataTableInputSelect.vue'
import EnvironmentVariableDropdown from '@/v2/features/environments/components/EnvironmentVariablesDropdown.vue'
import type { ClientLayout } from '@/v2/types/layout'

import { backspaceCommand, pillPlugin } from './code-variable-widget'

/**
 * CodeInput is a flexible input component that can render as:
 * - A disabled text display
 * - A select dropdown (for enums, booleans, or examples)
 * - A CodeMirror editor with environment variable support
 */
type Props = {
  modelValue: string | number
  /** Environment for variable substitution. Pass undefined to disable environment variables */
  environment: XScalarEnvironment | undefined
  /** Type of the input value, affects rendering mode for booleans */
  type?: string | string[]
  /** Render as disabled text display */
  disabled?: boolean
  /** Show error styling */
  error?: boolean
  /** Layout context affects styling and behavior */
  layout?: ClientLayout
  /** Predefined enum values, triggers select mode */
  enum?: string[]
  /** Example values, triggers select mode */
  examples?: string[]
  /** Default value to show in select mode */
  default?: string | number
  /** Allow null in boolean select options */
  nullable?: boolean
  /** Placeholder text for empty input */
  placeholder?: string
  /** Show required indicator */
  required?: boolean
  /** Enable color picker extension */
  colorPicker?: boolean
  /** Show line numbers in editor */
  lineNumbers?: boolean
  /** Enable linting */
  lint?: boolean
  /** Enable line wrapping */
  lineWrapping?: boolean
  /** CodeMirror language mode */
  language?: CodeMirrorLanguage
  /** Additional CodeMirror extensions */
  extensions?: Extension[]
  /** Disable tab key for indentation */
  disableTabIndent?: boolean
  /** Disable enter key */
  disableEnter?: boolean
  /** Disable automatic bracket closing */
  disableCloseBrackets?: boolean
  /** Emit submit event on blur */
  emitOnBlur?: boolean
  /** Enable environment variable pills */
  withVariables?: boolean
  /** Detect and emit curl commands */
  importCurl?: boolean
  /** Custom change handler, prevents default emit */
  handleFieldChange?: (value: string) => void
  /** Custom submit handler, prevents default emit */
  handleFieldSubmit?: (value: string) => void
}

const {
  modelValue,
  environment,
  type,
  disabled = false,
  error = false,
  layout = 'desktop',
  enum: enumProp,
  examples,
  default: defaultProp,
  nullable = false,
  placeholder,
  required,
  colorPicker = false,
  lineNumbers = false,
  lint = false,
  lineWrapping = false,
  language,
  extensions = [],
  disableTabIndent = false,
  disableEnter = false,
  disableCloseBrackets = false,
  emitOnBlur = true,
  withVariables = true,
  importCurl = false,
  handleFieldChange,
  handleFieldSubmit,
} = defineProps<Props>()

const emit = defineEmits<Emits>()

type Emits = {
  'update:modelValue': [value: string]
  'submit': [value: string]
  'blur': [value: string]
  'curl': [value: string]
  'redirectToEnvironment': []
}

// ---------------------------------------------------------------------------
// Component identity and focus state

const attrs = useAttrs() as { id?: string }
const componentId = attrs.id || `id-${nanoid()}`
const isFocused = ref(false)

// ---------------------------------------------------------------------------
// Rendering mode detection

/**
 * Determines if we should render a select dropdown for boolean types.
 */
const isBooleanMode = computed((): boolean => {
  if (enumProp?.length) {
    return false
  }
  return type === 'boolean' || (Array.isArray(type) && type.includes('boolean'))
})

/**
 * Options for boolean select mode.
 */
const booleanOptions = computed((): string[] => {
  return nullable ? ['true', 'false', 'null'] : ['true', 'false']
})

/**
 * Default type when dealing with type arrays.
 * Finds the first non-null type.
 */
const defaultType = computed((): string | undefined => {
  if (Array.isArray(type)) {
    return type.find((t) => t !== 'null') ?? 'string'
  }
  return type
})

// ---------------------------------------------------------------------------
// Event handlers

/**
 * Handles value changes during typing.
 * Detects curl commands and manages update flow.
 */
const handleChange = (value: string): void => {
  if (value === modelValue) {
    return
  }

  // Detect curl command import
  if (importCurl && value.trim().toLowerCase().startsWith('curl')) {
    emit('curl', value)

    // Revert to previous value
    if (codeMirror.value) {
      codeMirror.value.dispatch({
        changes: {
          from: 0,
          to: codeMirror.value.state.doc.length,
          insert: String(modelValue),
        },
      })
    }
    return
  }

  // Use custom handler or emit update
  if (handleFieldChange) {
    handleFieldChange(value)
  } else {
    emit('update:modelValue', value)
  }
}

/**
 * Handles form submission (enter key or blur with emitOnBlur).
 */
const handleSubmit = (value: string): void => {
  if (handleFieldSubmit) {
    handleFieldSubmit(value)
  } else {
    emit('submit', value)
  }
}

/**
 * Handles input blur event.
 */
const handleBlur = (value: string): void => {
  isFocused.value = false

  if (emitOnBlur && modelValue) {
    handleSubmit(value)
  }

  emit('blur', value)
}

/**
 * Handles model value updates from select components.
 */
const handleSelectChange = (value: string): void => {
  emit('update:modelValue', value)
}

// ---------------------------------------------------------------------------
// CodeMirror setup

/**
 * Build extensions array.
 * Note: Extensions are not reactive after initialization.
 */
const buildExtensions = (): Extension[] => {
  const extensionsList: Extension[] = [...extensions]

  if (colorPicker) {
    extensionsList.push(colorPickerExtension)
  }

  return extensionsList
}

/**
 * Reactive pill plugin for environment variable visualization.
 */
const pillPluginExtension = computed(() =>
  pillPlugin({
    environment,
    isReadOnly: layout === 'modal',
  }),
)

/**
 * Combined extensions for CodeMirror.
 */
const codeMirrorExtensions = computed((): Extension[] => [
  ...buildExtensions(),
  pillPluginExtension.value,
  backspaceCommand,
])

const codeMirrorRef: Ref<HTMLDivElement | null> = ref(null)

const { codeMirror } = useCodeMirror({
  content: toRef(() => String(modelValue ?? '')),
  onChange: (value) => {
    handleChange(value)
    updateDropdownVisibility()
  },
  onFocus: () => {
    isFocused.value = true
  },
  onBlur: handleBlur,
  codeMirrorRef,
  disableTabIndent: toRef(() => disableTabIndent),
  disableEnter: toRef(() => disableEnter),
  disableCloseBrackets: toRef(() => disableCloseBrackets),
  lineNumbers: toRef(() => lineNumbers),
  language: toRef(() => language),
  lint: toRef(() => lint),
  extensions: codeMirrorExtensions,
  placeholder: toRef(() => placeholder),
})

/**
 * Handle autofocus attribute.
 */
watch(codeMirror, () => {
  if (codeMirror.value && Object.hasOwn(attrs, 'autofocus')) {
    codeMirror.value.focus()
  }
})

// ---------------------------------------------------------------------------
// Environment variable dropdown

const showDropdown = ref(false)
const dropdownQuery = ref('')
const dropdownPosition = ref({ left: 0, top: 0 })
const dropdownRef = ref<InstanceType<
  typeof EnvironmentVariableDropdown
> | null>(null)

const { handleDropdownSelect, updateDropdownVisibility } = useDropdown({
  codeMirror,
  query: dropdownQuery,
  showDropdown,
  dropdownPosition,
})

/**
 * Determines if the environment variable dropdown should be visible.
 */
const displayVariablesDropdown = computed((): boolean => {
  return (
    showDropdown.value &&
    withVariables &&
    layout !== 'modal' &&
    Boolean(environment)
  )
})

// ---------------------------------------------------------------------------
// Keyboard event handling

/**
 * Handles keyboard navigation for dropdown and form submission.
 */
const handleKeyDown = (key: string, event: KeyboardEvent): void => {
  if (showDropdown.value) {
    if (key === 'down' || key === 'up') {
      event.preventDefault()
      dropdownRef.value?.handleArrowKey(key)
    } else if (key === 'enter') {
      event.preventDefault()
      dropdownRef.value?.handleSelect()
    }
    return
  }

  if (key === 'escape' && !disableTabIndent) {
    event.stopPropagation()
  }

  if (key === 'enter' && event.target instanceof HTMLDivElement) {
    handleSubmit(event.target.textContent ?? '')
  }
}

// ---------------------------------------------------------------------------
// Public API

defineExpose({
  focus: () => codeMirror.value?.focus(),
  handleChange,
  handleSubmit,
  handleBlur,
  booleanOptions,
  codeMirror,
  modelValue,
})
</script>
<script lang="ts">
// use normal <script> to declare options
export default {
  inheritAttrs: false,
}
</script>
<template>
  <!-- Disabled mode: read-only text display -->
  <div
    v-if="disabled"
    class="text-c-2 flex cursor-default items-center justify-center"
    :class="layout === 'modal' ? 'font-code pr-2 pl-1 text-base' : 'px-2'"
    data-testid="code-input-disabled">
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

  <!-- Editor mode: CodeMirror with environment variable support -->
  <div
    v-else
    :id="componentId"
    v-bind="$attrs"
    ref="codeMirrorRef"
    class="group/input group-[.alert]:outline-orange group-[.error]:outline-red font-code peer relative w-full overflow-hidden text-xs leading-[1.44] whitespace-nowrap -outline-offset-1 has-[:focus-visible]:rounded-[4px] has-[:focus-visible]:outline"
    :class="{
      'line-wrapping has-[:focus-visible]:bg-b-1 has-[:focus-visible]:absolute has-[:focus-visible]:z-1':
        lineWrapping,
      'flow-code-input--error': error,
    }"
    @keydown.down.stop="handleKeyDown('down', $event)"
    @keydown.enter="handleKeyDown('enter', $event)"
    @keydown.escape="handleKeyDown('escape', $event)"
    @keydown.up.stop="handleKeyDown('up', $event)">
    <!-- Tab exit hint (shown when focused) -->
    <div
      v-if="!disableTabIndent"
      class="z-context text-c-2 absolute right-1.5 bottom-1 hidden font-sans group-has-[:focus-visible]/input:block"
      role="alert">
      Press
      <kbd class="-mx-0.25 rounded border px-0.5 font-mono">Esc</kbd> then
      <kbd class="-mx-0.25 rounded border px-0.5 font-mono">Tab</kbd> to exit
    </div>
  </div>

  <!-- Warning slot (positioned absolutely) -->
  <div
    v-if="$slots.warning"
    class="centered-y text-orange absolute right-7 text-xs">
    <slot name="warning" />
  </div>

  <!-- Icon slot (positioned absolutely) -->
  <div
    v-if="$slots.icon"
    class="centered-y absolute right-0 flex h-full items-center p-1.5 group-has-[.cm-focused]:z-1">
    <slot name="icon" />
  </div>

  <!-- Required indicator -->
  <div
    v-if="required"
    class="required centered-y text-xxs text-c-3 group-[.error]:text-red bg-b-1 pointer-events-none absolute right-0 mr-0.5 pt-px pr-2 opacity-100 shadow-[-8px_0_4px_var(--scalar-background-1)] transition-opacity duration-150 group-[.alert]:bg-transparent group-[.alert]:shadow-none group-[.error]:bg-transparent group-[.error]:shadow-none peer-has-[.cm-focused]:opacity-0">
    Required
  </div>

  <!-- Environment variable autocomplete dropdown -->
  <EnvironmentVariableDropdown
    v-if="displayVariablesDropdown && environment"
    ref="dropdownRef"
    :dropdownPosition="dropdownPosition"
    :environment="environment"
    :query="dropdownQuery"
    @redirect="emit('redirectToEnvironment')"
    @select="handleDropdownSelect" />
</template>
<style scoped>
/*
 Deep styling for customizing Codemirror
*/
:deep(.cm-editor) {
  height: 100%;
  outline: none;
  padding: 0;
  background: transparent;
}
:deep(.cm-placeholder) {
  color: var(--scalar-color-3);
}
:deep(.cm-content) {
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-small);
  max-height: 20px;
  padding: 8px 0;
}
/* Tooltip helper */
:deep(.cm-tooltip) {
  background: transparent !important;
  filter: brightness(var(--scalar-lifted-brightness));
  border-radius: var(--scalar-radius);
  box-shadow: var(--scalar-shadow-2);
  border: none !important;
  outline: none !important;
  overflow: hidden !important;
}
:deep(.cm-tooltip-autocomplete ul li) {
  padding: 3px 6px !important;
}
:deep(.cm-completionIcon-type:after) {
  color: var(--scalar-color-3) !important;
}
:deep(.cm-tooltip-autocomplete ul li[aria-selected]) {
  background: var(--scalar-background-2) !important;
  color: var(--scalar-color-1) !important;
}
:deep(.cm-tooltip-autocomplete ul) {
  padding: 6px !important;
  position: relative;
}
:deep(.cm-tooltip-autocomplete ul li:hover) {
  border-radius: 3px;
  color: var(--scalar-color-1) !important;
  background: var(--scalar-background-3) !important;
}
/* Disable active line highlighting */
:deep(.cm-activeLine),
:deep(.cm-activeLineGutter) {
  background-color: transparent;
}
/* Color selection matching */
:deep(.cm-selectionMatch),
:deep(.cm-matchingBracket) {
  border-radius: var(--scalar-radius);
  background: var(--scalar-background-4) !important;
}
/* Color Picker Swatches */
:deep(.cm-css-color-picker-wrapper) {
  display: inline-flex;
  outline: 1px solid var(--scalar-background-3);
  border-radius: 3px;
  overflow: hidden;
}
/* Number gutter */
:deep(.cm-gutters) {
  background-color: transparent;
  border-right: none;
  color: var(--scalar-color-3);
  font-size: var(--scalar-small);
  line-height: 22px;
  border-radius: 0 0 0 3px;
}
:deep(.cm-gutters:before) {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(100% - 2px);
  height: calc(100% - 4px);
  border-radius: var(--scalar-radius) 0 0 var(--scalar-radius);
  background-color: var(--scalar-background-1);
}
:deep(.cm-gutterElement) {
  font-family: var(--scalar-font-code) !important;
  padding-left: 0px !important;
  padding-right: 6px !important;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative;
}
:deep(.cm-lineNumbers .cm-gutterElement) {
  min-width: fit-content;
}
:deep(.cm-gutter + .cm-gutter :not(.cm-foldGutter) .cm-gutterElement) {
  padding-left: 0 !important;
}
:deep(.cm-scroller) {
  overflow: auto;
}
.line-wrapping:focus-within :deep(.cm-content) {
  display: inline-table;
  min-height: fit-content;
  padding: 3px 6px;
  white-space: break-spaces;
  word-break: break-all;
}
</style>
<style>
.cm-pill {
  --tw-bg-base: var(--scalar-color-1);
  color: var(--tw-bg-base);
  padding: 0px 9px;
  border-radius: 3px;
  display: inline-block;
  border-radius: 30px;
  font-size: var(--scalar-small);
  background: color-mix(in srgb, var(--tw-bg-base), transparent 94%) !important;
}
.cm-pill.bg-grey {
  background: var(--scalar-background-3) !important;
}
.dark-mode .cm-pill {
  background: color-mix(in srgb, var(--tw-bg-base), transparent 90%) !important;
}
.cm-pill:first-of-type {
  margin-left: 0;
}
.cm-editor .cm-widgetBuffer {
  display: none;
}
.cm-foldPlaceholder:hover {
  color: var(--scalar-color-1);
}
.cm-foldGutter .cm-gutterElement {
  font-size: var(--scalar-heading-4);
  padding: 2px !important;
}
.cm-foldGutter .cm-gutterElement:first-of-type {
  display: none;
}
.cm-foldGutter .cm-gutterElement .cm-foldMarker {
  padding: 2px;
  padding-top: 2px;
}
.cm-foldGutter .cm-gutterElement:hover .cm-foldMarker {
  background: var(--scalar-background-2);
  border-radius: var(--scalar-radius);
  color: var(--scalar-color-1);
}
</style>
