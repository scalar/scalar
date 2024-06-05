<script setup lang="ts">
import EnvironmentVariableDropdown from '@/views/Environment/EnvironmentVariableDropdown.vue'
import { ScalarIconButton } from '@scalar/components'
import { computed, ref } from 'vue'

import DataTableCell from './DataTableCell.vue'

const props = withDefaults(
  defineProps<{
    type?: string
    required?: boolean
    modelValue: string | number
    readOnly?: boolean
  }>(),
  { required: false, readOnly: false },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'inputFocus'): void
  (e: 'inputBlur'): void
  (e: 'selectVariable', value: string): void
}>()

defineOptions({ inheritAttrs: false })

const mask = ref(true)
const query = ref('')
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
    : props.type ?? 'text',
)

const handleInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  query.value = input.value
  emit('update:modelValue', input.value)
}

const handleSelect = (value: string) => {
  emit('update:modelValue', value)
}

const handleDropdownMouseDown = () => {
  interactingWithDropdown.value = true
}

const handleDropdownMouseUp = () => {
  interactingWithDropdown.value = false
}
</script>
<template>
  <DataTableCell class="relative flex">
    <div
      v-if="$slots.default"
      class="text-c-2 flex items-center pl-2 pr-0 min-w-[100px] border-r">
      <slot />
    </div>
    <input
      v-bind="$attrs"
      autocomplete="off"
      class="placeholder:text-c-3 focus:text-c-1 text-c-2 min-w-0 flex-1 px-2 py-[5.75px]"
      data-1p-ignore
      :readOnly="readOnly"
      :required="required"
      spellcheck="false"
      :type="inputType"
      :value="modelValue"
      @blur="handleBlur"
      @focus="emit('inputFocus')"
      @input="handleInput" />
    <ScalarIconButton
      v-if="type === 'password'"
      class="-ml-.5 mr-1 h-6 w-6 self-center p-1.5"
      :icon="mask ? 'Show' : 'Hide'"
      :label="mask ? 'Show Password' : 'Hide Password'"
      @click="mask = !mask" />
    <EnvironmentVariableDropdown
      :query="query"
      @mousedown="handleDropdownMouseDown"
      @mouseup="handleDropdownMouseUp"
      @select="handleSelect" />
  </DataTableCell>
</template>
