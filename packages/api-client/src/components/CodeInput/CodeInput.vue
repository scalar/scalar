<script setup lang="ts">
import {
  colorPicker as colorPickerExtension,
  useCodeMirror,
  type CodeMirrorLanguage,
  type Extension,
} from '@scalar/use-codemirror'
import { nanoid } from 'nanoid'
import { ref, toRef, useAttrs, watch, type Ref } from 'vue'

const props = withDefaults(
  defineProps<{
    colorPicker?: boolean
    modelValue: string
    error?: boolean
    emitOnBlur?: boolean
    lineNumbers?: boolean
    language?: CodeMirrorLanguage
    handleFieldSubmit?: (e: string) => void
    handleFieldChange?: (e: string) => void
  }>(),
  {
    emitOnBlur: true,
    colorPicker: false,
  },
)
const emit = defineEmits<{
  (e: 'submit', v: string): void
  (e: 'update:modelValue', v: string): void
}>()

const attrs = useAttrs()
const uid = (attrs.id as string) || `id-${nanoid()}`

const isFocused = ref(false)

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

const codeMirrorRef: Ref<HTMLDivElement | null> = ref(null)

const { codeMirror } = useCodeMirror({
  content: toRef(() => props.modelValue ?? ''),
  onChange: handleChange,
  onFocus: () => (isFocused.value = true),
  onBlur: (val) => handleBlur(val),
  codeMirrorRef,
  lineNumbers: toRef(() => props.lineNumbers),
  language: toRef(() => props.language),
  extensions,
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
</script>
<script lang="ts">
// use normal <script> to declare options
export default {
  inheritAttrs: false,
}
</script>
<template>
  <div
    :id="uid"
    v-bind="$attrs"
    ref="codeMirrorRef"
    class="font-code w-full whitespace-nowrap text-xs leading-[1.44]"
    :class="{
      'flow-code-input--error': error,
    }" />
</template>
<style scoped>
/*
 Deep styling for customizing Codemirror
*/
:deep(.cm-editor) {
  background-color: transparent;
  height: 100%;
  outline: none;
  padding: 3px 0;
}
:deep(.cm-content) {
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-mini);
}
/* Tooltip helper */
:deep(.cm-tooltip) {
  background: transparent !important;
  filter: brightness(var(--scalar-lifted-brightness));
  border-radius: var(--scalar-radius-xl);
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
