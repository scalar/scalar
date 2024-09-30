<script setup lang="ts">
import { ScalarIconButton } from '@scalar/components'
import { computed, ref } from 'vue'

import DataTableCell from './DataTableCell.vue'
import DataTableInputSelect from './DataTableInputSelect.vue'

const props = withDefaults(
  defineProps<{
    id?: string
    type?: string
    /** Class for the wrapping cell because attrs is bound to the input */
    containerClass?: string
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
    : (props.type ?? 'text'),
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
      class="text-c-2 flex min-w-[120px] items-center border-r-1/2 pl-2 pr-0">
      <slot />
    </div>
    <div class="row-1">
      <template v-if="props.enum && props.enum.length">
        <DataTableInputSelect
          :canAddCustomValue="canAddCustomEnumValue"
          :modelValue="props.modelValue"
          :value="props.enum"
          @update:modelValue="emit('update:modelValue', $event)" />
      </template>
      <template v-else>
        <input
          v-bind="$attrs"
          :id="id"
          autocomplete="off"
          class="border-none text-c-1 disabled:text-c-2 min-w-0 w-full peer px-2 py-1.5 outline-none"
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
        <div
          v-if="required"
          class="absolute centered-y right-0 pt-px pr-2 text-xxs text-c-3 bg-b-1 shadow-[-8px_0_4px_var(--scalar-background-1)] opacity-100 duration-150 transition-opacity peer-focus:opacity-0">
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
      class="-ml-.5 mr-1 h-6 w-6 self-center p-1.5"
      :icon="mask ? 'Show' : 'Hide'"
      :label="mask ? 'Show Password' : 'Hide Password'"
      @click="mask = !mask" />
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
