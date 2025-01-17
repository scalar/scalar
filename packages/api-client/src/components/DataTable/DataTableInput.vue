<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import DataTableCheckbox from '@/components/DataTable/DataTableCheckbox.vue'
import type { VueClassProp } from '@/types/vue'
import { ScalarIconButton } from '@scalar/components'
import { computed, ref } from 'vue'

import DataTableCell from './DataTableCell.vue'
import DataTableInputSelect from './DataTableInputSelect.vue'

const props = withDefaults(
  defineProps<{
    id?: string
    type?: string
    /** Class for the wrapping cell because attrs is bound to the input */
    containerClass?: VueClassProp
    required?: boolean
    modelValue: string | number
    /** Allows adding a custom value to the enum dropdown, defaults to true */
    canAddCustomEnumValue?: boolean
    readOnly?: boolean
    enum?: string[]
    min?: number
    max?: number
  }>(),
  { canAddCustomEnumValue: true, required: false, readOnly: false },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'inputFocus'): void
  (e: 'inputBlur'): void
  (e: 'selectVariable', value: string): void
}>()

defineOptions({ inheritAttrs: false })

const mask = ref(true)
const interactingWithDropdown = ref(false)

const handleBlur = () => {
  if (!interactingWithDropdown.value) {
    emit('inputBlur')
  }
}

const inputType = computed(() =>
  props.type === 'password'
    ? mask.value
      ? 'password'
      : 'text'
    : (props.type ?? 'text'),
)
</script>
<template>
  <DataTableCell
    class="relative row"
    :class="containerClass">
    <div
      v-if="$slots.default"
      class="text-c-1 flex items-center pl-3 pr-0">
      <slot />:
    </div>
    <div class="row-1 overflow-x-auto">
      <template v-if="props.enum && props.enum.length">
        <DataTableInputSelect
          :canAddCustomValue="canAddCustomEnumValue"
          :modelValue="props.modelValue"
          :value="props.enum"
          @update:modelValue="emit('update:modelValue', $event)" />
      </template>
      <template v-else>
        <input
          v-if="mask && type === 'password'"
          v-bind="$attrs"
          :id="id"
          autocomplete="off"
          class="border-none text-c-1 disabled:text-c-2 min-w-0 w-full peer px-2 py-1.25 -outline-offset-2"
          data-1p-ignore
          :readOnly="readOnly"
          spellcheck="false"
          :type="inputType"
          :value="modelValue"
          @input="
            emit(
              'update:modelValue',
              ($event.target as HTMLInputElement).value ?? '',
            )
          " />
        <CodeInput
          v-else
          v-bind="$attrs"
          :id="id"
          class="border-none text-c-1 disabled:text-c-2 min-w-0 w-full peer"
          disableCloseBrackets
          disableTabIndent
          :max="max"
          :min="min"
          :modelValue="modelValue ?? ''"
          :readOnly="readOnly"
          :required="required"
          spellcheck="false"
          :type="inputType"
          @blur="handleBlur"
          @focus="emit('inputFocus')"
          @update:modelValue="emit('update:modelValue', $event)" />
        <div
          v-if="required"
          class="scalar-input-required absolute centered-y right-2 pt-px text-xxs text-c-3 bg-b-1 shadow-[-8px_0_4px_var(--scalar-background-1)] opacity-100 duration-150 transition-opacity peer-has-[:focus-visible]:opacity-0">
          Required
        </div>
      </template>
    </div>
    <div
      v-if="$slots.warning"
      class="absolute centered-y right-7 text-orange text-xs">
      <slot name="warning" />
    </div>
    <slot name="icon" />
    <ScalarIconButton
      v-if="type === 'password'"
      class="-ml-.5 mr-0.75 h-6 w-6 self-center p-1.5"
      :icon="mask ? 'Show' : 'Hide'"
      :label="mask ? 'Show Password' : 'Hide Password'"
      @click="mask = !mask" />
  </DataTableCell>
</template>

<style scoped>
:deep(.cm-editor) {
  padding: 0;
}
:deep(.cm-content) {
  align-items: center;
  background-color: transparent;
  display: flex;
  font-family: var(--scalar-font);
  font-size: var(--scalar-mini);
  padding: 6px 8px;
}
:deep(.cm-content):has(.cm-pill) {
  padding: 4px 3px;
}
:deep(.cm-content .cm-pill:not(:last-of-type)) {
  margin-right: 0.5px;
}
:deep(.cm-content .cm-pill:not(:first-of-type)) {
  margin-left: 0.5px;
}
:deep(.cm-line) {
  padding: 0;
}
.required::after {
  content: 'Required';
}
/* Tailwind placeholder is busted */
input::placeholder {
  color: var(--scalar-color-3);
}
</style>
