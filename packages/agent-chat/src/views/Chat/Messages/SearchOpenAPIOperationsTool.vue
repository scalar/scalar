<script setup lang="ts">
import { ScalarPopover } from '@scalar/components'
import { type ToolUIPart, type UIMessage } from 'ai'
import { computed, ref, watch, type Reactive, type Ref } from 'vue'

import ContextItem from '@/components/ContextItem.vue'
import LoadingSearchOpenAPIOperations from '@/components/LoadingSearchOpenAPIOperations.vue'
import type { SEARCH_OPENAPI_OPERATIONS_TOOL_NAME } from '@/entities/tools/search-openapi-operations'
import { getOperations } from '@/helpers'
import { useState, type Tools } from '@/state/state'

const { messagePart, message } = defineProps<{
  messagePart: Ref<
    ToolUIPart<Pick<Tools, typeof SEARCH_OPENAPI_OPERATIONS_TOOL_NAME>>
  >
  message: Reactive<UIMessage>
}>()

const MAX_VISIBLE = 5

const messageFinished = ref(false)

watch(
  () => message,
  () => {
    const parts = message.parts

    const index = parts.findIndex(
      (part) =>
        'toolCallId' in part &&
        part.toolCallId === messagePart.value.toolCallId,
    )

    messageFinished.value = Boolean(parts[index + 1])
  },
)

const operations = computed(() => {
  if (!messagePart.value.output) {
    return
  }

  return messagePart.value.output.flatMap((spec) => {
    const title = spec.info?.title

    const documentOperations = getOperations(spec)

    return documentOperations
      .map(
        (operation) =>
          `${title ? `${title} - ` : ''}${operation.summary ?? ''}`,
      )
      .filter(Boolean)
  })
})

const visibleOperations = computed(() =>
  operations.value?.slice(0, MAX_VISIBLE),
)
const hiddenOperations = computed(
  () => operations.value?.slice(MAX_VISIBLE) ?? [],
)

const state = useState()
</script>

<template>
  <div
    v-if="
      messagePart.value.state === 'input-available' &&
      state.chat.status === 'streaming'
    ">
    <LoadingSearchOpenAPIOperations />
  </div>
  <div
    v-if="operations"
    class="operations">
    <ContextItem
      v-for="operation of visibleOperations"
      :key="operation"
      :loading="!messageFinished">
      {{ operation }}
    </ContextItem>
    <ScalarPopover
      v-if="hiddenOperations.length"
      placement="bottom-start">
      <ContextItem :loading="!messageFinished">
        +{{ hiddenOperations.length }}
      </ContextItem>
      <template #popover>
        <div class="overflowPopover">
          <ContextItem
            v-for="operation of hiddenOperations"
            :key="operation"
            :loading="!messageFinished">
            {{ operation }}
          </ContextItem>
        </div>
      </template>
    </ScalarPopover>
  </div>
</template>

<style scoped>
.operations {
  display: flex;
  gap: 5px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.operations:empty {
  margin-bottom: -12px;
}
.overflowPopover {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
}
</style>
