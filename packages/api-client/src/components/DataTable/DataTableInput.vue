<script setup lang="ts">
import EnvironmentVariableDropdown from '@/views/Environment/EnvironmentVariableDropdown.vue'
import { ScalarIconButton } from '@scalar/components'
import { computed, ref } from 'vue'

import DataTableCell from './DataTableCell.vue'
import DataTableInputEnumSelect from './DataTableInputEnumSelect.vue'

const props = withDefaults(
  defineProps<{
    id?: string
    type?: string
    /** Class for the wrapping cell because attrs is bound to the input */
    containerClass?: string
    required?: boolean
    modelValue: string | number
    readOnly?: boolean
    enum?: string[]
    min?: number
    max?: number
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
  <DataTableCell
    class="relative row"
    :class="containerClass">
    <div
      v-if="$slots.default"
      class="text-c-2 flex min-w-[100px] items-center border-r-1/2 pl-2 pr-0">
      <slot />
    </div>
    <div
      class="group row-1"
      :class="{
        'relative required after:absolute after:centered-y after:right-0 after:pt-px after:pr-2 after:text-xxs after:font-medium after:text-c-3 after:bg-b-1 after:shadow-[-8px_0_4px_var(--scalar-background-1)] group-has-[:focus]:after:hidden':
          required,
      }">
      <template v-if="props.enum && props.enum.length">
        <DataTableInputEnumSelect
          :enum="props.enum"
          :modelValue="props.modelValue"
          @update:modelValue="emit('update:modelValue', $event)" />
      </template>
      <template v-else>
        <input
          v-bind="$attrs"
          :id="id"
          autocomplete="off"
          class="border-none focus:text-c-1 text-c-2 min-w-0 w-full px-2 py-1.5 outline-none"
          data-1p-ignore
          :max="max"
          :min="min"
          :readOnly="readOnly"
          :required="required"
          spellcheck="false"
          :type="inputType"
          :value="modelValue"
          @blur="handleBlur"
          @focus="emit('inputFocus')"
          @input="handleInput" />
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

<style scoped>
.required::after {
  content: 'Required';
}
/* Tailwind placeholder is busted */
input::placeholder {
  color: var(--scalar-color-3);
}
</style>
