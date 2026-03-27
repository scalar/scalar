<script setup lang="ts">
import type { ToolUIPart, UIMessage } from 'ai'
import { ref, watch, type Reactive, type Ref } from 'vue'

import LoadingOpenAPISpecsSummary from '@/components/LoadingOpenAPISpecsSummary.vue'
import type { SUMMARIZE_OPENAPI_SPECS_TOOL_NAME } from '@/entities/tools/get-openapi-specs-summary'
import { type Tools } from '@/state/state'

const { messagePart, message } = defineProps<{
  messagePart: Ref<
    ToolUIPart<Pick<Tools, typeof SUMMARIZE_OPENAPI_SPECS_TOOL_NAME>>
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
</script>

<template>
  <div v-if="!messageFinished">
    <LoadingOpenAPISpecsSummary />
  </div>
</template>

<style scoped></style>
