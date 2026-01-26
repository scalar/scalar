<script setup lang="ts">
import { type ToolUIPart, type UIMessage } from 'ai'
import { computed, ref, watch, type Reactive, type Ref } from 'vue'

import ContextItem from '@/components/ContextItem.vue'
import LoadingMiniOpenAPIDoc from '@/components/LoadingMiniOpenAPIDoc.vue'
import type { GET_MINI_OPENAPI_SPEC_TOOL_NAME } from '@/entities/tools/get-mini-openapi-spec'
import { getOperations } from '@/helpers'
import { useState, type Tools } from '@/state/state'

const { messagePart, message } = defineProps<{
  messagePart: Ref<
    ToolUIPart<Pick<Tools, typeof GET_MINI_OPENAPI_SPEC_TOOL_NAME>>
  >
  message: Reactive<UIMessage>
}>()

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
  if (!messagePart.value.output?.structuredContent) {
    return
  }

  const title = messagePart.value.output?.structuredContent?.info?.title

  const documentOperations = getOperations(
    messagePart.value.output?.structuredContent,
  )

  return documentOperations
    .map(
      (operation) => `${title ? `${title} - ` : ''}${operation.summary ?? ''}`,
    )
    .filter(Boolean)
})

const state = useState()
</script>

<template>
  <div
    v-if="
      messagePart.value.state === 'input-available' &&
      state.chat.status === 'streaming'
    ">
    <LoadingMiniOpenAPIDoc />
  </div>
  <div
    v-if="operations"
    class="operations">
    <ContextItem
      v-for="operation of operations"
      :key="operation"
      :loading="!messageFinished">
      {{ operation }}
    </ContextItem>
  </div>
</template>

<style scoped>
.operations {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-bottom: 12px;
}
.operations:empty {
  margin-bottom: -12px;
}
</style>
