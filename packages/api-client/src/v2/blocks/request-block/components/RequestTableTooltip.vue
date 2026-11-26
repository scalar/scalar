<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import { ScalarPopover } from '@scalar/components/popover'
import { ScalarIconInfo, ScalarIconWarning } from '@scalar/icons'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed, toDisplayString } from 'vue'

import { validateParameter } from '@/v2/blocks/request-block/helpers/validate-parameter'
import { useLocalization } from '@/v2/features/localization'

const { schema, value, description } = defineProps<{
  schema?: SchemaObject
  value: string | File | null
  description?: string
}>()

const { translate } = useLocalization()

const invalidParameterMessage = computed(() => validateParameter(schema, value))
const isInvalid = computed(() => invalidParameterMessage.value.ok === false)
const schemaDetails = computed<string[]>(() => {
  if (!schema) {
    return []
  }

  const type = 'type' in schema ? schema.type : undefined

  return [
    Array.isArray(type) ? type.join(' | ') : (type ?? ''),
    'format' in schema ? (schema.format ?? '') : '',
    'minimum' in schema && schema.minimum !== undefined
      ? `${translate('apiClient.requestTableTooltip.min')} ${schema.minimum}`
      : '',
    'maximum' in schema && schema.maximum !== undefined
      ? `${translate('apiClient.requestTableTooltip.max')} ${schema.maximum}`
      : '',
    'default' in schema && schema.default !== undefined
      ? `${translate('apiClient.requestTableTooltip.default')} ${toDisplayString(schema.default)}`
      : '',
  ].filter((detail) => detail.trim().length > 0)
})
const hasDescription = computed<boolean>(() => Boolean(description?.trim()))
const hasContent = computed<boolean>(
  () =>
    isInvalid.value || schemaDetails.value.length > 0 || hasDescription.value,
)
</script>
<template>
  <ScalarPopover
    v-if="hasContent"
    :offset="4"
    placement="left"
    teleport>
    <button
      :aria-label="
        isInvalid
          ? translate('apiClient.requestTableTooltip.invalid')
          : translate('apiClient.requestTableTooltip.moreInformation')
      "
      class="text-c-2 hover:text-c-1 hover:bg-b-2 rounded p-1"
      :role="isInvalid ? 'alert' : 'none'"
      type="button">
      <ScalarIconWarning
        v-if="isInvalid"
        class="text-orange size-3.5 brightness-90 hover:brightness-75" />
      <ScalarIconInfo
        v-else
        class="text-c-2 hover:text-c-1 size-3.5" />
    </button>
    <template #popover>
      <div
        class="text-xxs text-c-1 grid w-fit max-w-xs min-w-0 gap-1.5 rounded p-1.5 leading-normal wrap-anywhere"
        data-testid="request-table-tooltip-content">
        <div
          v-if="invalidParameterMessage.ok === false"
          class="text-error-1">
          {{ invalidParameterMessage.message }}
        </div>
        <div
          v-else-if="schemaDetails.length"
          class="schema text-c-2 *:not-first:before:content-['_·_']">
          <span
            v-for="(detail, index) in schemaDetails"
            :key="index"
            >{{ detail }}</span
          >
        </div>
        <ScalarMarkdown
          v-if="hasDescription && !isInvalid"
          :value="description" />
      </div>
    </template>
  </ScalarPopover>
</template>
