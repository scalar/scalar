<script setup lang="ts">
import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import type { VueClassProp } from '@/types/vue'
import { useId } from 'vue'

const props = withDefaults(
  defineProps<{
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

const id = useId()
</script>
<template>
  <DataTableInput
    :id="id"
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
      <label :for="id">
        <slot />
      </label>
    </template>
    <template #icon>
      <slot name="icon" />
    </template>
  </DataTableInput>
</template>
