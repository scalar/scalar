<script setup lang="ts">
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { useId, type MaybeRefOrGetter } from 'vue'

import { DataTableInput } from '@/components/DataTable'
import type { EnvVariable } from '@/store'

/**
 * Vue class prop type
 *
 * Vue seems to just use any behind the scenes
 *
 * @see https://vuejs.org/guide/essentials/class-and-style.html#class-and-style-bindings
 */
export type VueClassProp = MaybeRefOrGetter<
  | string
  | Record<string, boolean>
  | (string | Record<string, boolean>)[]
  | false
>

const {
  containerClass,
  environment,
  envVariables,
  readOnly = false,
  required = false,
  type,
} = defineProps<{
  containerClass?: VueClassProp
  environment: Environment
  envVariables: EnvVariable[]
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
    :envVariables="envVariables"
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
