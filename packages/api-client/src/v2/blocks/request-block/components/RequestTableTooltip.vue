<script setup lang="ts">
import { ScalarMarkdown, ScalarPopover } from '@scalar/components'
import { ScalarIconInfo, ScalarIconWarning } from '@scalar/icons'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { validateParameter } from '@/v2/blocks/request-block/helpers/validate-parameter'

const { schema, value, description } = defineProps<{
  schema?: SchemaObject
  value: string | File | null
  description?: string
}>()

const invalidParameterMessage = computed(() => validateParameter(schema, value))
const isInvalid = computed(() => invalidParameterMessage.value.ok === false)
</script>
<template>
  <ScalarPopover
    :offset="4"
    placement="left"
    teleport>
    <button
      :aria-label="isInvalid ? 'Input is invalid' : 'More Information'"
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
        class="w-content text-xxs text-c-1 grid min-w-48 gap-1.5 rounded px-1.5 pt-2 pb-1.5 leading-none">
        <div
          v-if="invalidParameterMessage.ok === false"
          class="text-error-1">
          {{ invalidParameterMessage.message }}
        </div>
        <div
          v-else-if="
            schema &&
            ('type' in schema ||
              'format' in schema ||
              'minimum' in schema ||
              'maximum' in schema ||
              'default' in schema)
          "
          class="schema text-c-2 flex items-center">
          <span v-if="'type' in schema">{{ schema.type }}</span>
          <span v-if="'format' in schema">{{ schema.format }}</span>
          <span v-if="'minimum' in schema">min: {{ schema.minimum }}</span>
          <span v-if="'maximum' in schema">max: {{ schema.maximum }}</span>
          <span v-if="'default' in schema">default: {{ schema.default }}</span>
        </div>
        <ScalarMarkdown
          v-if="description && !isInvalid"
          class="max-w-[16rem]"
          :value="description" />
      </div>
    </template>
  </ScalarPopover>
</template>
<style scoped>
.schema > span:not(:first-child)::before {
  content: '·';
  display: block;
  margin: 0 0.5ch;
}

.schema > span {
  display: flex;
  white-space: nowrap;
}
</style>
