<script setup lang="ts">
import {
  colorPicker as colorPickerExtension,
  useCodeMirror,
  type CodeMirrorLanguage,
  type Extension,
} from '@scalar/use-codemirror'
import { nanoid } from 'nanoid'
import { ref, toRef, useAttrs, watch, type Ref, computed } from 'vue'
import DataTableInputSelect from '../DataTable/DataTableInputSelect.vue'

import { dropdownPlugin } from './codeDropdownWidget'
import { pillPlugin, backspaceCommand } from './codeVariableWidget'
import { useWorkspace } from '@/store/workspace'

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
    withServers?: boolean
  }>(),
  {
    disableCloseBrackets: false,
    disableEnter: false,
    disableTabIndent: false,
    emitOnBlur: true,
    colorPicker: false,
    nullable: false,
    withVariables: true,
    withServers: false,
  },
)
const emit = defineEmits<{
  (e: 'submit', v: string): void
  (e: 'update:modelValue', v: string): void
}>()

const attrs = useAttrs()
const uid = (attrs.id as string) || `id-${nanoid()}`

const isFocused = ref(false)

const { activeWorkspace } = useWorkspace()

// ---------------------------------------------------------------------------
// Event mapping from codemirror to standard input interfaces

/** Change is emitted during typing. This does not trigger validation */
function handleChange(value: string) {
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
if (props.withVariables && !activeWorkspace.value.isReadOnly) {
  extensions.push(dropdownPlugin({ withServers: props.withServers }))
}
extensions.push(pillPlugin, backspaceCommand)
const codeMirrorRef: Ref<HTMLDivElement | null> = ref(null)

const { codeMirror } = useCodeMirror({
  content: toRef(() =>
    props.modelValue !== undefined ? String(props.modelValue) : '',
  ),
  onChange: handleChange,
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

// Computed property to check if type is boolean and nullable
const booleanOptions = computed(() => {
  return props.type === 'boolean' ||
    props.type?.includes('boolean') ||
    props.nullable
    ? ['true', 'false', 'null']
    : ['true', 'false']
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
      class="peer font-code w-full whitespace-nowrap text-xs leading-[1.44] relative"
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
    class="required absolute centered-y right-0 pt-px pr-2 text-xxs text-c-3 bg-b-1 shadow-[-8px_0_4px_var(--scalar-background-1)] opacity-100 duration-150 transition-opacity peer-has-[.cm-focused]:opacity-0">
    Required
  </div>
</template>
<style scoped>
/*
 Deep styling for customizing Codemirror
*/
:deep(.cm-editor) {
  height: 100%;
  outline: none;
  padding: 3px 0;
  background: transparent;
}
:deep(.cm-content) {
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-mini);
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
  z-index: 10000;
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
  font-size: var(--scalar-mini);
  line-height: 1.44;
}
:deep(.cm-gutterElement) {
  font-family: var(--scalar-font-code) !important;
  padding: 0 6px 0 8px !important;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
:deep(.cm-gutter + .cm-gutter .cm-gutterElement) {
  padding-left: 0 !important;
}
</style>
<style>
.cm-pill {
  background-color: var(--scalar-background-accent);
  color: var(--scalar-color-accent);
  padding: 1px 5px;
  margin: 1px 0;
  border-radius: 3px;
  display: inline-block;
  border-radius: 30px;
  font-size: var(--scalar-mini);
}
</style>
