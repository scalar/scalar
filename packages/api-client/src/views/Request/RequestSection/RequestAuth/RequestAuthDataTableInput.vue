<script setup lang="ts">
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import type { VueClassProp } from '@/types/vue'

const props = withDefaults(
  defineProps<{
    id: string
    type?: string
    containerClass?: VueClassProp
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
</script>
<template>
  <DataTableInput
    :id="props.id"
    :canAddCustomEnumValue="!props.readOnly"
    :containerClass="props.containerClass"
    :modelValue="props.modelValue"
    :readOnly="props.readOnly"
    :required="props.required"
    :type="props.type"
    v-bind="$attrs"
    @inputBlur="emit('inputBlur')"
    @inputFocus="emit('inputFocus')"
    @selectVariable="emit('selectVariable', $event)"
    @update:modelValue="emit('update:modelValue', $event)">
    <template #default>
      <label :for="props.id">
        <slot />
      </label>
    </template>
    <template #icon>
      <slot name="icon" />
    </template>
  </DataTableInput>
</template>
