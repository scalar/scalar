<script setup lang="ts">
import { ScalarIconArrowUp, ScalarIconSparkle } from '@scalar/icons'
import { ref } from 'vue'

import { useLocalization } from '@/features/localization'
import { useAgentContext } from '@/hooks/use-agent'

const agentContext = useAgentContext()
const { translate } = useLocalization()

const message = ref('')
const inputRef = ref<HTMLInputElement>()

function handleSubmit() {
  agentContext.value?.openAgent(message.value)
  message.value = ''
}

/**
 * The field only stays expanded while focus is inside it, so pressing its icon, its padding or the
 * send button must not take focus from the input. Safari and Firefox on macOS do not focus a clicked
 * button: focus would fall back to the page and collapse the field before the click could send.
 */
const keepFocusInInput = (event: MouseEvent): void => {
  if (event.target !== inputRef.value) {
    event.preventDefault()
  }
}
</script>
<template>
  <form
    v-if="agentContext?.agentEnabled.value"
    class="agent-button-container"
    @click="inputRef?.focus()"
    @mousedown="keepFocusInInput"
    @submit.prevent="handleSubmit()">
    <ScalarIconSparkle
      class="size-3 shrink-0"
      weight="fill" />
    <div class="ask-agent-scalar-input-label">
      {{ translate('agent.askAiAgent') }}
    </div>
    <input
      ref="inputRef"
      v-model="message"
      class="ask-agent-scalar-input"
      :class="{ 'ask-agent-scalar-input-not-empty': message.length > 0 }"
      :placeholder="translate('agent.askAiAgent')" />
    <button
      class="ask-agent-scalar-send"
      type="submit">
      <ScalarIconArrowUp
        class="size-3"
        weight="bold" />
    </button>
  </form>
</template>
<style scoped>
/** Container */
.agent-button-container {
  position: relative;
  color: var(--scalar-color-1);
  background: color-mix(in srgb, var(--scalar-background-3), white 15%);
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 1px 6px;
  margin-right: 4px;
  border-radius: var(--scalar-radius);
  z-index: 2;
  height: 100%;
}
.agent-button-container:hover:not(:focus-within) {
  background: color-mix(in srgb, var(--scalar-background-3), white 20%);
}
/*
 * Expanded, the field is drawn over the whole footer, so it only stays open while focus is inside it.
 * Focus moving on to the example picker or Test Request collapses it and uncovers them. A typed
 * question is kept and comes back with the field.
 */
.agent-button-container:focus-within {
  position: absolute;
  inset: 2px;
  border-radius: var(--scalar-radius-lg);
  margin-right: 0;
  height: auto;
}
.agent-button-container:has(.ask-agent-scalar-input:focus-visible) {
  outline-style: solid;
}
/** Input */
.ask-agent-scalar-input {
  width: 0px;
  opacity: 0;
  font-size: 0px;
  border: none;
}
.agent-button-container:focus-within .ask-agent-scalar-input {
  width: 100%;
  font-size: inherit;
  opacity: 1;
  line-height: 20px;
  outline: none;
  padding-inline: 4px;
}
.ask-agent-scalar-input::placeholder {
  color: var(--scalar-color-2);
  font-family: inherit;
}
/** Input label */
.ask-agent-scalar-input-label {
  /** Shown by default */
  color: var(--scalar-color-1);
  font-weight: var(--scalar-semibold);
  margin-left: 4px;
}
.agent-button-container:focus-within .ask-agent-scalar-input-label {
  /** Hidden when input is focused */
  display: none;
}
/** Send button */
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
  outline-offset: 1px;
  /* Hidden by default */
  display: none;
}
.agent-button-container:focus-within:has(.ask-agent-scalar-input-not-empty)
  .ask-agent-scalar-send {
  /** Show while the expanded field holds a question */
  display: flex;
}
.ask-agent-scalar-send:hover {
  background: color-mix(in srgb, var(--scalar-color-blue), transparent 10%);
}
</style>
