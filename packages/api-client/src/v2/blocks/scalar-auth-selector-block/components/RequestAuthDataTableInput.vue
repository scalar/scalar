<script setup lang="ts">
import { ScalarIconButton } from '@scalar/components/icon-button'
import { ScalarIconArrowCounterClockwise } from '@scalar/icons'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { useId } from 'vue'

import type { VueClassProp } from '@/types/vue'
import { DataTableInput } from '@/v2/components/data-table'
import { useLocalization } from '@/v2/features/localization'

const {
  canReset = false,
  containerClass,
  environment,
  readOnly = false,
  required = false,
  type,
} = defineProps<{
  /** Restore this credential's current document or configured default. */
  canReset?: boolean
  containerClass?: VueClassProp
  environment: XScalarEnvironment
  readOnly?: boolean
  required?: boolean
  type?: string
}>()

const emit = defineEmits<{
  (e: 'reset'): void
  (e: 'inputFocus'): void
  (e: 'inputBlur'): void
  (e: 'selectVariable', value: string): void
}>()

const modelValue = defineModel<string>({ default: '', required: true })
const id = useId()
const { translate } = useLocalization()
/**
 * The unmasked editor is a contenteditable div, which a <label for> cannot
 * name, so the field points back at the visible label via aria-labelledby.
 * The masked native input keeps its <label for> and gets the same text.
 */
const labelId = `${id}-label`
</script>
<template>
  <DataTableInput
    :id="id"
    v-bind="$attrs"
    v-model="modelValue"
    :aria-labelledby="labelId"
    :canAddCustomEnumValue="!readOnly"
    :containerClass="containerClass"
    :environment="environment"
    :readOnly="readOnly"
    :required="required"
    :type="type"
    @inputBlur="emit('inputBlur')"
    @inputFocus="emit('inputFocus')"
    @selectVariable="emit('selectVariable', $event)">
    <template #default>
      <label
        :id="labelId"
        :for="id">
        <slot />
      </label>
    </template>
    <template #icon>
      <slot name="icon" />
      <ScalarIconButton
        v-if="canReset && !readOnly"
        class="h-6 w-6 self-center p-1.25"
        :icon="ScalarIconArrowCounterClockwise"
        :label="translate('apiClient.dataTableInput.resetValue')"
        @click="emit('reset')" />
    </template>
  </DataTableInput>
</template>
