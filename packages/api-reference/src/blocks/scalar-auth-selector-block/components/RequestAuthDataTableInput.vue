<script setup lang="ts">
import { DataTableInput } from '@scalar/api-client/components/DataTable'
import type { EnvVariable } from '@scalar/api-client/store'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { useId, type MaybeRefOrGetter } from 'vue'

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

const props = withDefaults(
  defineProps<{
    type?: string
    containerClass?: VueClassProp
    required?: boolean
    modelValue: string | number
    readOnly?: boolean
    environment: Environment
    envVariables: EnvVariable[]
    workspace: Workspace
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
    v-bind="$attrs"
    :envVariables="props.envVariables"
    :environment="props.environment"
    lineWrapping
    :modelValue="props.modelValue"
    :readOnly="props.readOnly"
    :required="props.required"
    :type="props.type"
    :workspace="props.workspace"
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
