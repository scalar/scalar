<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import {
  colorPicker as colorPickerExtension,
  useCodeMirror,
  useDropdown,
  type CodeMirrorLanguage,
  type Extension,
} from '@scalar/use-codemirror'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { nanoid } from 'nanoid'
import { computed, ref, toRef, useAttrs, watch, type Ref } from 'vue'

import { useLayout } from '@/hooks'
import type { EnvVariable } from '@/store/active-entities'
import EnvironmentVariableDropdown from '@/views/Environment/EnvironmentVariableDropdown.vue'

import DataTableInputSelect from '../DataTable/DataTableInputSelect.vue'
import { backspaceCommand, pillPlugin } from './codeVariableWidget'

const props = withDefaults(
  defineProps<{
    colorPicker?: boolean
    disabled?: boolean
    modelValue: string | number
    error?: boolean
    emitOnBlur?: boolean
    extensions?: Extension[]
    lineNumbers?: boolean
    lint?: boolean
    disableTabIndent?: boolean
    language?: CodeMirrorLanguage
    handleFieldSubmit?: (e: string) => void
    handleFieldChange?: (e: string) => void
    placeholder?: string
    required?: boolean
    disableEnter?: boolean
    disableCloseBrackets?: boolean
    enum?: string[]
    examples?: string[]
    type?: string | string[] | undefined
    nullable?: boolean
    withVariables?: boolean
    importCurl?: boolean
    isCopyable?: boolean
    default?: string | number
    environment: Environment
    envVariables: EnvVariable[]
    workspace: Workspace
    lineWrapping?: boolean
  }>(),
  {
    disableCloseBrackets: false,
    disableEnter: false,
    extensions: () => [],
    disableTabIndent: false,
    emitOnBlur: true,
    colorPicker: false,
    nullable: false,
    withVariables: true,
    isCopyable: false,
    disabled: false,
    lineWrapping: false,
  },
)
const emit = defineEmits<{
  (e: 'submit', v: string): void
  (e: 'update:modelValue', v: string): void
  (e: 'curl', v: string): void
  (e: 'blur', v: string): void
}>()

const attrs = useAttrs() as { id?: string }
const uid = (attrs.id as string) || `id-${nanoid()}`

const isFocused = ref(false)

// Environment variable dropdown init
const showDropdown = ref(false)
const dropdownQuery = ref('')
const dropdownPosition = ref({ left: 0, top: 0 })
const dropdownRef = ref<InstanceType<
  typeof EnvironmentVariableDropdown
> | null>(null)

const { layout } = useLayout()
const { copyToClipboard } = useClipboard()

// ---------------------------------------------------------------------------
// Event mapping from codemirror to standard input interfaces

/** Change is emitted during typing. This does not trigger validation */
function handleChange(value: string) {
  // We need to be careful, only if the value is different we trigger an update
  // on initial load of the component, this gets triggered cause we set the content
  if (value === props.modelValue) {
    return null
  }
  if (props.importCurl && value.trim().toLowerCase().startsWith('curl')) {
    emit('curl', value)
    // Maintain previous input value
    codeMirror.value?.dispatch({
      changes: {
        from: 0,
        to: codeMirror.value.state.doc.length,
        insert: String(props.modelValue),
      },
    })
    // Prevent table value population on current request
    return null
  }

  return props.handleFieldChange
    ? props.handleFieldChange(value)
    : emit('update:modelValue', value)
}

/** Submit is emitted on blur and enter. This will trigger validation */
function handleSubmit(value: string) {
  return props.handleFieldSubmit
    ? props.handleFieldSubmit(value)
    : emit('submit', value)
}

/** Optional submit on blur.  */
function handleBlur(value: string) {
  isFocused.value = false
  if (props.emitOnBlur && props.modelValue) {
    handleSubmit(value)
  }
  emit('blur', value)
}

// ---------------------------------------------------------------------------
// Codemirror instance handling

// WARNING: Extensions are non-reactive! If props change nothing will happen

const extensions: Extension[] = [...props.extensions]
if (props.colorPicker) {
  extensions.push(colorPickerExtension)
}

// Create a reactive pill plugin that updates when environment changes
const pillPluginExtension = computed(() =>
  pillPlugin({
    environment: props.environment,
    envVariables: props.envVariables,
    workspace: props.workspace,
    isReadOnly: layout === 'modal',
  }),
)

// Base extensions that will be used for the editor
const baseExtensions = computed(() => [
  ...extensions,
  pillPluginExtension.value,
  backspaceCommand,
])

const codeMirrorRef: Ref<HTMLDivElement | null> = ref(null)

const { codeMirror } = useCodeMirror({
  content: toRef(() =>
    props.modelValue !== undefined ? String(props.modelValue) : '',
  ),
  onChange: (value) => {
    handleChange(value)
    updateDropdownVisibility()
  },
  onFocus: () => (isFocused.value = true),
  onBlur: (val) => handleBlur(val),
  codeMirrorRef,
  disableTabIndent: toRef(() => props.disableTabIndent),
  disableEnter: toRef(() => props.disableEnter),
  disableCloseBrackets: toRef(() => props.disableCloseBrackets),
  lineNumbers: toRef(() => props.lineNumbers),
  language: toRef(() => props.language),
  lint: toRef(() => props.lint),
  extensions: baseExtensions,
  placeholder: toRef(() => props.placeholder),
})

codeMirror.value?.focus()

// If we specify autofocus then focus codemirror on creation
watch(codeMirror, () => {
  if (
    codeMirror.value &&
    Object.prototype.hasOwnProperty.call(attrs, 'autofocus')
  ) {
    codeMirror.value.focus()
  }
})

const { handleDropdownSelect, updateDropdownVisibility } = useDropdown({
  codeMirror,
  query: dropdownQuery,
  showDropdown,
  dropdownPosition,
})

// Computed property to check if type is boolean and nullable
const booleanOptions = computed(() =>
  props.nullable ? ['true', 'false', 'null'] : ['true', 'false'],
)

const handleKeyDown = (key: string, event: KeyboardEvent) => {
  if (showDropdown.value) {
    if (key === 'down') {
      event.preventDefault()
      dropdownRef.value?.handleArrowKey('down')
    } else if (key === 'up') {
      event.preventDefault()
      dropdownRef.value?.handleArrowKey('up')
    } else if (key === 'enter') {
      event.preventDefault()
      dropdownRef.value?.handleSelect()
    }
  } else if (key === 'escape') {
    if (!props.disableTabIndent) {
      event.stopPropagation()
    }
  } else if (key === 'enter' && event.target instanceof HTMLDivElement) {
    handleSubmit(event.target.textContent ?? '')
  }
}

const defaultType = computed(() => {
  return Array.isArray(props.type)
    ? // Find the first type, that's not 'null'
      (props.type.find((type) => type !== 'null') ?? 'string')
    : // If it's not an array, just return the type
      props.type
})

const displayVariablesDropdown = computed(
  () =>
    showDropdown.value &&
    props.withVariables &&
    layout !== 'modal' &&
    props.environment,
)

defineExpose({
  /** Expose focus method */
  focus: () => {
    codeMirror.value?.focus()
  },
  // Expose these methods for testing
  handleChange,
  handleSubmit,
  handleBlur,
  booleanOptions,
  codeMirror,
  modelValue: props.modelValue,
})
</script>
<script lang="ts">
// use normal <script> to declare options
export default {
  inheritAttrs: false,
}
</script>
<template>
  <template v-if="disabled">
    <div
      class="text-c-2 flex cursor-default items-center justify-center"
      :class="layout === 'modal' ? 'font-code pr-2 pl-1 text-base' : 'px-2'"
      data-testid="code-input-disabled">
      <span class="whitespace-nowrap">{{ modelValue }}</span>
    </div>
  </template>
  <template v-else-if="props.enum && props.enum.length">
    <DataTableInputSelect
      :default="props.default"
      :modelValue="modelValue"
      :type="defaultType"
      :value="props.enum"
      @update:modelValue="emit('update:modelValue', $event)" />
  </template>
  <template v-else-if="type === 'boolean' || type?.includes('boolean')">
    <DataTableInputSelect
      :default="props.default"
      :modelValue="modelValue"
      :value="booleanOptions"
      @update:modelValue="emit('update:modelValue', $event)" />
  </template>
  <template v-else-if="props.examples && props.examples.length">
    <DataTableInputSelect
      :default="props.default"
      :modelValue="props.modelValue"
      :value="props.examples"
      @update:modelValue="emit('update:modelValue', $event)" />
  </template>
  <template v-else>
    <div
      :id="uid"
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
      <div
        v-if="isCopyable"
        class="scalar-code-copy z-context">
        <button
          class="copy-button"
          type="button"
          @click="copyToClipboard(prettyPrintJson(modelValue))">
          <span class="sr-only">Copy content</span>

          <ScalarIcon
            icon="Clipboard"
            size="md" />
        </button>
      </div>
      <div
        v-if="!disableTabIndent"
        class="z-context text-c-2 absolute right-1.5 bottom-1 hidden font-sans group-has-[:focus-visible]/input:block"
        role="alert">
        Press
        <kbd class="-mx-0.25 rounded border px-0.5 font-mono">Esc</kbd> then
        <kbd class="-mx-0.25 rounded border px-0.5 font-mono">Tab</kbd> to exit
      </div>
    </div>
  </template>
  <div
    v-if="$slots.warning"
    class="centered-y text-orange absolute right-7 text-xs">
    <slot name="warning" />
  </div>
  <div
    v-if="$slots.icon"
    class="centered-y absolute right-0 flex h-full items-center p-1.5 group-has-[.cm-focused]:z-1">
    <slot name="icon" />
  </div>
  <div
    v-if="required"
    class="required centered-y text-xxs text-c-3 group-[.error]:text-red bg-b-1 pointer-events-none absolute right-0 mr-0.5 pt-px pr-2 opacity-100 shadow-[-8px_0_4px_var(--scalar-background-1)] transition-opacity duration-150 group-[.alert]:bg-transparent group-[.alert]:shadow-none group-[.error]:bg-transparent group-[.error]:shadow-none peer-has-[.cm-focused]:opacity-0">
    Required
  </div>
  <EnvironmentVariableDropdown
    v-if="displayVariablesDropdown"
    ref="dropdownRef"
    :dropdownPosition="dropdownPosition"
    :envVariables="envVariables"
    :environment="environment"
    :query="dropdownQuery"
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
  line-height: 1.44;
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
  padding: 0 6px 0 8px !important;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative;
}
:deep(.cm-gutter + .cm-gutter :not(.cm-foldGutter) .cm-gutterElement) {
  padding-left: 0 !important;
}
:deep(.cm-scroller) {
  overflow: auto;
}
/* Copy Button */
.peer:hover .copy-button,
.copy-button:focus-visible {
  opacity: 100;
}
.scalar-code-copy {
  align-items: flex-start;
  display: flex;
  inset: 0;
  justify-content: flex-end;
  position: sticky;
}
.copy-button {
  align-items: center;
  display: flex;
  position: relative;
  background-color: var(--scalar-background-2);
  border: 1px solid var(--scalar-border-color);
  border-radius: 3px;
  color: var(--scalar-color-3);
  cursor: pointer;
  height: 30px;
  margin-bottom: -30px;
  opacity: 0;
  padding: 6px;
  transition:
    opacity 0.15s ease-in-out,
    color 0.15s ease-in-out;
  top: 0px;
  right: 0px;
}
.scalar-code-copy,
.copy-button {
  /* Pass down the background color */
  background: inherit;
}
.copy-button:hover {
  color: var(--scalar-color-1);
}
.copy-button svg {
  stroke-width: 1.5;
}
.line-wrapping:focus-within :deep(.cm-content) {
  min-height: fit-content;
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
