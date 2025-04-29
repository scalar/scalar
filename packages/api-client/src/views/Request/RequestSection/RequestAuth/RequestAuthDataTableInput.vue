<script setup lang="ts">
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { useId } from 'vue'

import DataTableInput from '@/components/DataTable/DataTableInput.vue'
import type { EnvVariable } from '@/store/active-entities'
import type { VueClassProp } from '@/types/vue'

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
