<script setup lang="ts">
import type { ToolUIPart } from 'ai'
import { reactive, toRef } from 'vue'

import { ASK_FOR_AUTHENTICATION_TOOL_NAME } from '@/entities/tools/ask-for-authentication'
import { EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME } from '@/entities/tools/execute-request'
import { GET_MINI_OPENAPI_SPEC_TOOL_NAME } from '@/entities/tools/get-mini-openapi-spec'
import { GET_OPENAPI_SPECS_SUMMARY_TOOL_NAME } from '@/entities/tools/get-openapi-spec-summary'
import { useState, type Tools } from '@/state/state'
import AskForAuthentication from '@/views/Chat/Messages/AskForAuthentication.vue'
import ExecuteRequestTool from '@/views/Chat/Messages/ExecuteRequestTool.vue'
import GetMiniOpenAPIDocTool from '@/views/Chat/Messages/GetMiniOpenAPIDocTool.vue'
import GetOpenAPISpecsSummary from '@/views/Chat/Messages/GetOpenAPISpecsSummary.vue'
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
            v-if="part.type.endsWith(EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME)"
            :messagePart="
              toRef(
                part as ToolUIPart<
                  Pick<Tools, typeof EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME>
                >,
              )
            " />
          <GetMiniOpenAPIDocTool
            v-if="part.type.endsWith(GET_MINI_OPENAPI_SPEC_TOOL_NAME)"
            :message="reactive(message)"
            :messagePart="
              toRef(
                part as ToolUIPart<
                  Pick<Tools, typeof GET_MINI_OPENAPI_SPEC_TOOL_NAME>
                >,
              )
            " />
          <GetOpenAPISpecsSummary
            v-if="part.type.endsWith(GET_OPENAPI_SPECS_SUMMARY_TOOL_NAME)"
            :message="reactive(message)"
            :messagePart="
              toRef(
                part as ToolUIPart<
                  Pick<Tools, typeof GET_OPENAPI_SPECS_SUMMARY_TOOL_NAME>
                >,
              )
            " />
          <AskForAuthentication
            v-if="part.type.endsWith(ASK_FOR_AUTHENTICATION_TOOL_NAME)"
            :message="reactive(message)"
            :messagePart="
              toRef(
                part as ToolUIPart<
                  Pick<Tools, typeof ASK_FOR_AUTHENTICATION_TOOL_NAME>
                >,
              )
            " />
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
  position: sticky;
  bottom: 20px;
  width: 100%;
  max-width: 744px;
  z-index: 1;
}
.chat :deep(.markdown) {
  margin-bottom: 12px;
}
</style>
