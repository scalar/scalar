<script setup lang="ts">
import { reactive, toRef } from 'vue'

import { ASK_FOR_AUTHENTICATION_TOOL_NAME } from '@/entities/tools/ask-for-authentication'
import { EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME } from '@/entities/tools/execute-request'
import { SUMMARIZE_OPENAPI_SPECS_TOOL_NAME } from '@/entities/tools/get-openapi-specs-summary'
import { SEARCH_OPENAPI_OPERATIONS_TOOL_NAME } from '@/entities/tools/search-openapi-operations'
import { useState } from '@/state/state'
import AskForAuthentication from '@/views/Chat/Messages/AskForAuthentication.vue'
import ExecuteRequestTool from '@/views/Chat/Messages/ExecuteRequestTool.vue'
import GetOpenAPISpecsSummary from '@/views/Chat/Messages/GetOpenAPISpecsSummary.vue'
import SearchOpenAPIOperationsTool from '@/views/Chat/Messages/SearchOpenAPIOperationsTool.vue'
import Text from '@/views/Chat/Messages/Text.vue'
import PromptForm from '@/views/PromptForm.vue'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'uploadApi'): void
}>()

const state = useState()
</script>

<template>
  <div class="chat">
    <template
      v-for="message in state.chat.messages"
      :key="message.id">
      <template v-if="message.role === 'user'">
        <div
          v-for="(part, index) in message.parts"
          :key="`${message.id}-${index}`"
          class="userMessage">
          <p v-if="part.type === 'text'">{{ part.text }}</p>
        </div>
      </template>
      <template v-if="message.role === 'assistant'">
        <div
          v-for="(part, index) in message.parts"
          :key="`${message.id}-${index}`">
          <Text
            v-if="part.type === 'text'"
            :messagePart="toRef(part)" />
          <ExecuteRequestTool
            v-if="
              part.type ===
              (`tool-${EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME}` as const)
            "
            :messagePart="toRef(part)" />
          <SearchOpenAPIOperationsTool
            v-if="
              part.type ===
              (`tool-${SEARCH_OPENAPI_OPERATIONS_TOOL_NAME}` as const)
            "
            :message="reactive(message)"
            :messagePart="toRef(part)" />
          <GetOpenAPISpecsSummary
            v-if="
              part.type ===
              (`tool-${SUMMARIZE_OPENAPI_SPECS_TOOL_NAME}` as const)
            "
            :message="reactive(message)"
            :messagePart="toRef(part)" />
          <AskForAuthentication
            v-if="
              part.type ===
              (`tool-${ASK_FOR_AUTHENTICATION_TOOL_NAME}` as const)
            "
            :message="reactive(message)"
            :messagePart="toRef(part)" />
        </div>
      </template>
    </template>
    <div class="spacer"></div>
  </div>
  <div class="formContainer">
    <PromptForm
      @submit="emit('submit')"
      @uploadApi="emit('uploadApi')" />
  </div>
</template>

<style scoped>
.chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px 0;
  max-width: 744px;
}

.userMessage {
  padding-top: 6px;
  padding-bottom: 6px;
  padding-inline: 16px;
  border-radius: 18px;
  background: var(--scalar-background-2);
  width: fit-content;
  max-width: 80%;
  margin-left: auto;
  font-size: 16px;
  line-height: 24px;
  color: var(--scalar-color-1);
  margin-bottom: 12px;
}
div + .userMessage {
  margin-top: 64px;
}
.chat > :deep(div:has(.executeRequestTool)) + div:has(.executeRequestTool) {
  margin-top: -12px;
}
.spacer {
  min-height: 280px;
  width: 100%;
}

.formContainer {
  position: fixed;
  bottom: 20px;
  width: 100%;
  max-width: 744px;
  z-index: 1;
}
.chat :deep(.markdown) {
  margin-bottom: 12px;
}
</style>
