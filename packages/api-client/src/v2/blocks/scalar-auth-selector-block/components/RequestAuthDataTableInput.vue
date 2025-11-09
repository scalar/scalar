<script setup lang="ts">
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { useId } from 'vue'

import type { VueClassProp } from '@/types/vue'
import { DataTableInput } from '@/v2/components/data-table'

const {
  containerClass,
  environment,
  readOnly = false,
  required = false,
  type,
} = defineProps<{
  containerClass?: VueClassProp
  environment: XScalarEnvironment
  readOnly?: boolean
  required?: boolean
  type?: string
}>()

const emit = defineEmits<{
  (e: 'inputFocus'): void
  (e: 'inputBlur'): void
  (e: 'selectVariable', value: string): void
}>()

const modelValue = defineModel<string>({ default: '', required: true })
const id = useId()
</script>
<template>
  <DataTableInput
    :id="id"
    v-bind="$attrs"
    v-model="modelValue"
    :canAddCustomEnumValue="!readOnly"
    :containerClass="containerClass"
    :environment="environment"
    lineWrapping
    :readOnly="readOnly"
    :required="required"
    :type="type"
    @inputBlur="emit('inputBlur')"
    @inputFocus="emit('inputFocus')"
    @selectVariable="emit('selectVariable', $event)">
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
