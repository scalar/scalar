<script setup lang="ts">
import { useTextareaAutosize } from '@vueuse/core'
import { nanoid } from 'nanoid'
import { type Ref, onMounted, ref, useAttrs } from 'vue'

import { cva, cx } from '@/cva'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    label?: string
    error?: boolean
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

const textField = cva({
  base: 'scalar-input-wrapper relative flex items-center rounded border border-border',
  variants: {
    focus: {
      true: 'scalar-input-wrapper-focus border-fore-3 has-actv-btn:border has-actv-btn:border-border',
    },
    error: { true: 'scalar-input-wrapper-error border-error' },
  },
})

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
<template>
  <div class="scalar-input-container relative">
    <div :class="textField({ error, focus: isFocused })">
      <label
        v-if="label"
        :class="
          cx(
            'scalar-input-label pointer-events-none absolute left-0 top-0 mx-2 my-3 bg-transparent px-1 text-xs',
            'shadow-label peer z-10 origin-top-left rounded bg-back-1 text-fore-3 transition-transform',
          )
        "
        :for="uid">
        {{ label }}
      </label>
      <component
        :is="isMultiline ? 'textarea' : 'input'"
        :id="uid"
        v-bind="$attrs"
        ref="input"
        class="scalar-input"
        :class="
          cx(
            { 'min-h-[77px]': isMultiline },
            'z-10 w-full resize-none appearance-none border-0 bg-transparent p-3 text-sm text-fore-1',
            'outline-none transition-opacity peer-[]:opacity-0',
          )
        "
        :placeholder="placeholder"
        :value="modelValue"
        @blur="handleBlur"
        @focus="isFocused = true"
        @input="handleChange"
        @keyup.enter="handleSubmit" />
      <div
        class="icon-slot !empty:flex !empty:items-center !empty:pr-3 !empty:w-7 cursor-pointer text-ghost hover:text-fore-1">
        <slot />
      </div>
    </div>
    <span
      :class="
        cx(
          'helper-text before:font-black before:rounded-full mt-1.5 flex items-center text-xs text-error',
          'before:mr-1.5 before:block before:h-4 before:w-4 before:text-center before:text-xxs before:leading-4',
          `before:bg-error before:text-white before:content-['!'] empty:hidden`,
        )
      ">
      {{ helperText }}
    </span>
  </div>
</template>
<style scoped>
.scalar-input:not(:placeholder-shown),
.scalar-input-wrapper-focus .scalar-input {
  opacity: 1;
  transition: opacity 0.2s ease-in-out 0.15s;
}
.scalar-input-wrapper-focus .scalar-input-label {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.scalar-input::selection {
  color: var(--theme-color-1, var(--default-theme-color-1));
  background: rgba(255, 165, 88, 0.35);
}
.scalar-input:-webkit-autofill,
.scalar-input:-webkit-autofill:hover,
.scalar-input:-webkit-autofill:focus,
.scalar-input:-webkit-autofill:active,
.scalar-input:focus-within:-webkit-autofill,
.scalar-input:focus-within:-webkit-autofill:hover,
.scalar-input:focus-within:-webkit-autofill:focus,
.scalar-input:focus-within:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0px 1000px
    var(--theme-background-1, var(--default-theme-background-1)) inset !important;
  -webkit-text-fill-color: var(--theme-color-1, var(--default-theme-color-1));
  color: var(--theme-color-1, var(--default-theme-color-1));
  border-radius: var(--theme-radius, var(--default-theme-radius));
}
.scalar-input-wrapper-focus .scalar-input-label,
.scalar-input:not(:placeholder-shown) + .scalar-input-label {
  transform: translate3d(0, -20px, 0) scale(0.8);
  transform-origin: top left;
}
.scalar-input-wrapper-focus:has(button:active) .scalar-input-label {
  color: var(--theme-color-3, var(--default-theme-color-3)) !important;
}
</style>
