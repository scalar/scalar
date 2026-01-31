<script setup lang="ts">
import { ScalarIconArrowUp, ScalarIconSparkle } from '@scalar/icons'
import { ref } from 'vue'

import { useAgentContext } from '@/hooks/use-agent'

const agentContext = useAgentContext()

const message = ref('')

function handleSubmit() {
  agentContext.value?.openAgent(message.value)
  message.value = ''
}
</script>
<template>
  <div
    v-if="agentContext?.agentEnabled.value"
    class="agent-button-container flex">
    <ScalarIconSparkle
      class="size-3 shrink-0"
      weight="fill" />
    <input
      v-model="message"
      class="ask-agent-scalar-input"
      placeholder="Ask AI Agent"
      @keydown.enter.stop="handleSubmit()" />
    <button
      class="ask-agent-scalar-send"
      type="button"
      @click="handleSubmit()">
      <ScalarIconArrowUp
        class="size-3"
        weight="bold" />
    </button>
  </div>
</template>
<style scoped>
.ask-agent-scalar-input {
  appearance: none;
  border: none;
  white-space: nowrap;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-small);
  line-height: 22px;
  font-family: var(--scalar-font);
  position: relative;
  cursor: pointer;
  box-sizing: border-box;
  outline: none;
  outline-offset: 2px;
  field-sizing: content;
  max-width: 88px;
}
.ask-agent-scalar-input:focus {
  cursor: text;
  width: 100% !important;
  max-width: calc(100% - 50px);
}
.ask-agent-scalar-input:not(:placeholder-shown) {
  width: 100% !important;
  height: 100%;
  field-sizing: border-box;
  cursor: text;
  max-width: calc(100% - 50px);
}
.ask-agent-scalar-input::placeholder {
  color: var(--scalar-color-1);
}
.ask-agent-scalar-input:focus::placeholder {
  color: var(--scalar-color-2);
}
.agent-button-container {
  position: relative;
  color: var(--scalar-color-1);
  background: color-mix(in srgb, var(--scalar-background-3), white 15%);
  display: flex;
  align-items: center;
  padding: 1px 6px;
  margin-right: 4px;
  border-radius: var(--scalar-radius);
  gap: 4px;
  z-index: 2;
  height: 24px;
}
.agent-button-container:hover:not(:focus-within) {
  background: color-mix(in srgb, var(--scalar-background-3), white 20%);
}
.agent-button-container:has(.ask-agent-scalar-input:not(:placeholder-shown)),
.agent-button-container:focus-within {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 0;
}
.ask-agent-scalar-send {
  background: var(--scalar-color-blue);
  color: #fff;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: var(--scalar-radius);
  margin-left: auto;
  display: none;
}
.ask-agent-scalar-send:hover {
  background: color-mix(
    in srgb,
    var(--scalar-color-blue),
    transparent 10%
  ) !important;
}
.agent-button-container:has(.ask-agent-scalar-input:not(:placeholder-shown))
  .ask-agent-scalar-send {
  display: flex;
}
</style>
