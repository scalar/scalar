<script setup lang="ts">
import { useTextareaAutosize } from '@vueuse/core'
import { nanoid } from 'nanoid'
import { onMounted, ref, useAttrs, type Ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    error?: boolean
    warn?: boolean
    isMultiline?: boolean
    helperText?: string
    emitOnBlur?: boolean
    handleFieldSubmit?: (e: string) => void
    handleFieldChange?: (e: string) => void
    /** Option to disable trimming for input fields */
    disableTrim?: boolean
  }>(),
  {
    emitOnBlur: true,
    disableTrim: false,
  },
)
const emit = defineEmits<{
  (e: 'submit', v: string): void
  (e: 'update:modelValue', v: string): void
}>()
const attrs = useAttrs()
const uid = (attrs.id as string) || `id-${nanoid()}`

const input = ref<HTMLInputElement | HTMLTextAreaElement | null>()

const isFocused = ref(false)
let triggerResize: () => void

if (props.isMultiline) {
  const { triggerResize: tr } = useTextareaAutosize({
    element: input as Ref<HTMLTextAreaElement>,
    input: props.modelValue,
  })
  triggerResize = tr
}

/** Change is emitted during typing. This does not trigger validation */
function handleChange(evt: Event) {
  const value = (evt.target as HTMLInputElement).value

  if (props.isMultiline) {
    triggerResize()
  }

  if (props.handleFieldChange) {
    props.handleFieldChange(value)
  } else {
    emit('update:modelValue', value)
  }
}

/** Submit is emitted on blur and enter. This will trigger validation */
function handleSubmit(evt: Event) {
  const target = evt.target as HTMLInputElement
  const value =
    props.disableTrim || props.isMultiline ? target.value : target.value.trim()

  if (props.handleFieldSubmit) {
    props.handleFieldSubmit(value)
  } else {
    emit('submit', value)
  }
}

/** Optional submit on blur.  */
function handleBlur(evt: Event) {
  isFocused.value = false

  if (props.emitOnBlur && props.modelValue) {
    handleSubmit(evt)
  }
}

onMounted(() => {
  if (Object.prototype.hasOwnProperty.call(attrs, 'autofocus')) {
    input.value?.focus()
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
  <div class="flow-input-cont">
    <div
      class="flow-input-wrapper"
      :class="{
        'flow-input-wrapper--focus': isFocused,
        'flow-input-wrapper--error': error,
        'flow-input-wrapper--warn': warn,
      }">
      <component
        :is="isMultiline ? 'textarea' : 'input'"
        :id="uid"
        v-bind="$attrs"
        ref="input"
        class="flow-input hotkeys"
        :class="{ 'flow-input__multiline': isMultiline }"
        :value="modelValue"
        @blur="handleBlur"
        @focus="isFocused = true"
        @input="handleChange"
        @keyup.enter="handleSubmit" />
      <label
        v-if="label"
        class="flow-label"
        :for="uid">
        {{ label }}
      </label>
      <div class="icon-slot">
        <slot />
      </div>
    </div>
    <span class="helper-text">{{ helperText }}</span>
  </div>
</template>
<style scoped>
.flow-input-cont {
  position: relative;
}
.flow-input-wrapper {
  border-radius: var(--theme-radius);
  border: var(--theme-border);
  position: relative;
  display: flex;
  align-items: center;
}
.flow-input-wrapper--focus {
  border-color: var(--theme-color-3);
}
.flow-input-wrapper--focus:has(button:active) {
  border: var(--theme-border) !important;
}
.flow-input__multiline {
  min-height: 77px;
}
.flow-label {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  padding: 0px 3px;
  margin: 12px 9px;
  width: fit-content;
  background: transparent;
  font-size: var(--theme-font-size-3);
  background-color: var(--theme-background-1);
  border-radius: var(--theme-radius);
  color: var(--theme-color-3);
  box-shadow: 0 0 2px 2px var(--theme-background-1);
  transition: transform 0.2s ease-in-out;
  transform-origin: top left;
  z-index: 10;
  line-height: initial;
}
.flow-input {
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  font-size: var(--theme-font-size-3);
  border: none;
  color: var(--theme-color-1);
  padding: 12px;
  width: 100%;
  background: transparent;
  z-index: 10;
  transition: opacity 0.15s ease-in-out;
  resize: none;
}
.flow-input:has(+ .flow-label) {
  opacity: 0;
}
.flow-input::placeholder {
  color: var(--theme-color-3);
}
.flow-input:not(:placeholder-shown),
.flow-input-wrapper--focus .flow-input {
  opacity: 1;
  transition: opacity 0.2s ease-in-out 0.15s;
}
.flow-input-wrapper--focus .flow-label {
  color: var(--theme-color-1);
}
.flow-input::selection {
  color: var(--theme-color-1);
  background: rgba(255, 165, 88, 0.35);
}
.flow-input:-webkit-autofill,
.flow-input:-webkit-autofill:hover,
.flow-input:-webkit-autofill:focus,
.flow-input:-webkit-autofill:active,
.flow-input:focus-within:-webkit-autofill,
.flow-input:focus-within:-webkit-autofill:hover,
.flow-input:focus-within:-webkit-autofill:focus,
.flow-input:focus-within:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0px 1000px var(--theme-background-1) inset !important;
  -webkit-text-fill-color: var(--theme-color-1);
  color: var(--theme-color-1);
  border-radius: var(--theme-radius);
}
.helper-text {
  margin-top: 6px;
  font-size: 13px;
  color: var(--theme-error-color);
  display: flex;
  align-items: center;
}
.helper-text:before {
  content: '!';
  border-radius: 50%;
  background: var(--theme-error-color);
  color: white;
  font-weight: 900;
  width: 15px;
  height: 15px;
  line-height: 15px;
  display: block;
  margin-right: 6px;
  text-align: center;
  font-size: 11px;
}
.helper-text:empty {
  display: none;
}
.flow-input-wrapper--error {
  border-color: var(--theme-error-color);
}
.flow-input-wrapper--error .flow-label {
  color: var(--theme-error-color);
}
.flow-input-wrapper--warn {
  border-color: var(--theme-error-color);
}
.flow-input-wrapper--warn .flow-label {
  color: var(--theme-error-color);
}
.flow-input-wrapper--focus .flow-label,
.flow-input:not(:placeholder-shown) + .flow-label {
  transform: translate3d(0, -20px, 0) scale(0.8);
  transform-origin: top left;
}
.flow-input-wrapper--focus:has(button:active) .flow-label {
  color: var(--theme-color-3) !important;
}
.icon-slot:not(:empty) {
  display: flex;
  align-items: center;
  padding-right: 12px;
  width: 28px;
  cursor: pointer;
  color: var(--theme-color-ghost);
}
.icon-slot:hover {
  color: var(--theme-color-1);
}
</style>
