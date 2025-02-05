<script setup lang="ts">
import {
  colorPicker as colorPickerExtension,
  useCodeMirror,
  type CodeMirrorLanguage,
  type Extension,
  useDropdown,
} from '@scalar/use-codemirror'
import { nanoid } from 'nanoid'
import { ref, toRef, useAttrs, watch, type Ref, computed } from 'vue'
import DataTableInputSelect from '../DataTable/DataTableInputSelect.vue'
import { pillPlugin, backspaceCommand } from './codeVariableWidget'
import EnvironmentVariableDropdown from '@/views/Environment/EnvironmentVariableDropdown.vue'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { ScalarIcon } from '@scalar/components'
import { prettyPrintJson } from '@scalar/oas-utils/helpers'
import { useActiveEntities } from '@/store/active-entities'
import { useLayout } from '@/hooks'

const props = withDefaults(
  defineProps<{
    colorPicker?: boolean
    disabled?: boolean
    modelValue: string | number
    error?: boolean
    emitOnBlur?: boolean
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
    type?: string
    nullable?: boolean
    withVariables?: boolean
    importCurl?: boolean
    isCopyable?: boolean
    default?: string | number
  }>(),
  {
    disableCloseBrackets: false,
    disableEnter: false,
    disableTabIndent: false,
    emitOnBlur: true,
    colorPicker: false,
    nullable: false,
    withVariables: true,
    isCopyable: false,
    disabled: false,
  },
)
const emit = defineEmits<{
  (e: 'submit', v: string): void
  (e: 'update:modelValue', v: string): void
  (e: 'curl', v: string): void
}>()

const attrs = useAttrs()
const uid = (attrs.id as string) || `id-${nanoid()}`

const isFocused = ref(false)

// Environment variable dropdown init
const showDropdown = ref(false)
const dropdownQuery = ref('')
const dropdownPosition = ref({ left: 0, top: 0 })
const dropdownRef = ref<InstanceType<
  typeof EnvironmentVariableDropdown
> | null>(null)

const { activeEnvVariables, activeEnvironment, activeWorkspace } =
  useActiveEntities()
const { layout } = useLayout()
const { copyToClipboard } = useClipboard()

// ---------------------------------------------------------------------------
// Event mapping from codemirror to standard input interfaces

/** Change is emitted during typing. This does not trigger validation */
function handleChange(value: string) {
  // We need to be careful, only if the value is different we trigger an update
  // on initial load of the component, this gets triggered cause we set the content
  if (value === props.modelValue) return null
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
  if (props.emitOnBlur && props.modelValue) handleSubmit(value)
}

// ---------------------------------------------------------------------------
// Codemirror instance handling

// WARNING: Extensions are non-reactive! If props change nothing will happen

const extensions: Extension[] = []
if (props.colorPicker) extensions.push(colorPickerExtension)
extensions.push(
  pillPlugin({
    environment: activeEnvironment.value,
    envVariables: activeEnvVariables.value,
    workspace: activeWorkspace.value,
    isReadOnly: layout === 'modal',
  }),
  backspaceCommand,
)
const codeMirrorRef: Ref<HTMLDivElement | null> = ref(null)

const { codeMirror } = useCodeMirror({
  content: toRef(() =>
    props.modelValue !== undefined ? String(props.modelValue) : '',
  ),
  onChange: (value) => {
    handleChange(value), updateDropdownVisibility()
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
  extensions,
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
const booleanOptions = computed(() => {
  return props.type === 'boolean' ||
    props.type?.includes('boolean') ||
    props.nullable
    ? ['true', 'false', 'null']
    : ['true', 'false']
})

/** Expose focus method */
defineExpose({
  focus: () => {
    codeMirror.value?.focus()
  },
})

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
  }
}
</script>
<script lang="ts">
// use normal <script> to declare options
export default {
  inheritAttrs: false,
}
</script>
<template>
  <template v-if="disabled">
    <div class="cursor-default flex items-center justify-center px-2 text-c-2">
      <span>{{ modelValue }}</span>
    </div>
  </template>
  <template v-else-if="props.enum && props.enum.length">
    <DataTableInputSelect
      :default="props.default"
      :modelValue="modelValue"
      :type="type"
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
      class="peer font-code w-full whitespace-nowrap overflow-hidden text-xs leading-[1.44] relative has-[:focus-visible]:outline has-[:focus-visible]:rounded-[4px] -outline-offset-1"
      :class="{
        'flow-code-input--error': error,
      }"
      @keydown.down.stop="handleKeyDown('down', $event)"
      @keydown.enter="handleKeyDown('enter', $event)"
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
    </div>
  </template>
  <div
    v-if="$slots.warning"
    class="absolute centered-y right-7 text-orange text-xs">
    <slot name="warning" />
  </div>
  <slot name="icon"></slot>
  <div
    v-if="required"
    class="required absolute centered-y right-0 pt-px pr-2 text-xxs text-c-3 bg-b-1 shadow-[-8px_0_4px_var(--scalar-background-1)] opacity-100 duration-150 transition-opacity peer-has-[.cm-focused]:opacity-0 pointer-events-none">
    Required
  </div>
  <EnvironmentVariableDropdown
    v-if="
      showDropdown && withVariables && layout !== 'modal' && activeEnvironment
    "
    ref="dropdownRef"
    :dropdownPosition="dropdownPosition"
    :envVariables="activeEnvVariables"
    :environment="activeEnvironment"
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
</style>
<style>
.cm-pill {
  --tw-bg-base: var(--scalar-color-1);
  color: var(--tw-bg-base);
  padding: 0px 9px;
  border-radius: 3px;
  display: inline-block;
  border-radius: 30px;
  font-size: var(--scalar-mini);
  background: color-mix(in srgb, var(--tw-bg-base), transparent 94%) !important;
}
.cm-pill.bg-grey {
  background: var(--scalar-background-3) !important;
}
.dark-mode .cm-pill {
  background: color-mix(in srgb, var(--tw-bg-base), transparent 80%) !important;
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
