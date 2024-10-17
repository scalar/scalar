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
import { useWorkspace } from '@/store'

const props = withDefaults(
  defineProps<{
    colorPicker?: boolean
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
    type?: string
    nullable?: boolean
    withVariables?: boolean
    importCurl?: boolean
  }>(),
  {
    disableCloseBrackets: false,
    disableEnter: false,
    disableTabIndent: false,
    emitOnBlur: true,
    colorPicker: false,
    nullable: false,
    withVariables: true,
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

const { activeEnvVariables, isReadOnly, environments, router } = useWorkspace()

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
    environments,
    activeEnvVariables,
    isReadOnly,
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
</script>
<script lang="ts">
// use normal <script> to declare options
export default {
  inheritAttrs: false,
}
</script>
<template>
  <template v-if="props.enum && props.enum.length">
    <DataTableInputSelect
      :modelValue="props.modelValue"
      :value="props.enum"
      @update:modelValue="emit('update:modelValue', $event)" />
  </template>
  <template
    v-else-if="props.type === 'boolean' || props.type?.includes('boolean')">
    <DataTableInputSelect
      :modelValue="props.modelValue"
      :value="booleanOptions"
      @update:modelValue="emit('update:modelValue', $event)" />
  </template>
  <template v-else>
    <div
      :id="uid"
      v-bind="$attrs"
      ref="codeMirrorRef"
      class="peer font-code w-full whitespace-nowrap overflow-hidden text-xs leading-[1.44] relative"
      :class="{
        'flow-code-input--error': error,
      }"></div>
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
    v-if="showDropdown && props.withVariables && !isReadOnly"
    :activeEnvVariables="computed(() => activeEnvVariables)"
    :dropdownPosition="dropdownPosition"
    :query="dropdownQuery"
    :router="router"
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
  background-color: var(--scalar-background-1);
  border-right: none;
  color: var(--scalar-color-3);
  font-size: var(--scalar-small);
  line-height: 1.44;
  border-radius: 0 0 0 3px;
}
:deep(.cm-gutterElement) {
  font-family: var(--scalar-font-code) !important;
  padding: 0 6px 0 8px !important;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
:deep(.cm-gutter + .cm-gutter :not(.cm-foldGutter) .cm-gutterElement) {
  padding-left: 0 !important;
}
:deep(.cm-scroller) {
  overflow: auto;
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
.cm-focused .cm-content ::selection {
  background: var(--scalar-selection-background) !important;
  color: var(--scalar-selection-color);
}
</style>
