<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue'

import FlowButton, { useLoadButtonState } from '../FlowButton.vue'
import MarkdownRenderer from './MarkdownRenderer.vue'
import TheHuman from './TheHuman.vue'

defineProps<{ aiWriterMarkdown: string }>()
const emits = defineEmits<{
  (event: 'startAIWriter', value: string[]): void
}>()
const loadingState = useLoadButtonState()

const useAIContentWriterState = () =>
  reactive({
    steps: [] as string[],
    open: true,
    show() {
      this.open = true
    },
    setStep(index: number, value: string) {
      this.steps[index] = value
    },
    spliceStep(index: number) {
      this.steps.splice(index, 1)
    },
    pushStep(value: string) {
      this.steps.push(value)
    },
  })

const state = useAIContentWriterState()

const extraStep = ref('')
const itemRefs = ref<HTMLElement[]>([])

const nextStep = ref<HTMLElement | null>(null)

async function extraStepHandler() {
  state.pushStep(extraStep.value)
  extraStep.value = ''
  await nextTick()
  itemRefs.value[state.steps.length - 1].focus()
}

async function sendContentCreationRequest() {
  loadingState.startLoading()
  emits('startAIWriter', state.steps)
  setTimeout(() => {
    loadingState.stopLoading()
  }, 2000)
}
async function handleCreatePage() {
  return {}
}
</script>
<template>
  <div class="swagger-ai-writer gap-1 flex-col">
    <div class="swagger-ai-writer-inputs">
      <TheHuman>
        <template #title>
          <h1>Open API / Swagger AI Writer</h1>
        </template>
        <template #description>
          Get a head start on writing a page for your API guide. Type queries
          related to a desired page and we'll pull from your swagger / open API
          file and output content for a API Guide.
        </template>
      </TheHuman>
      <div class="swagger-ai-writer-inputs-container">
        <div class="aiwriter aiwriter__show">
          <input
            v-for="(step, index) in state.steps"
            :key="index"
            ref="itemRefs"
            class="aiwriter-input"
            placeholder="i.e How to Create a User"
            type="text"
            :value="step"
            @input="
              state.setStep(index, ($event.target as HTMLInputElement).value)
            "
            @keydown.delete="step === '' ? state.spliceStep(index) : () => {}"
            @keydown.enter="nextStep?.focus()" />
          <input
            ref="nextStep"
            v-model="extraStep"
            class="aiwriter-input"
            placeholder="i.e How to Create a User"
            type="text"
            @input="extraStepHandler" />
          <div class="animated-input">
            <span>Create a user</span>
            <span>Delete a user</span>
            <span>Add to database</span>
            <span>Get started</span>
          </div>
        </div>
        <FlowButton
          label="Generate Content"
          :loaderState="loadingState"
          @click="sendContentCreationRequest" />
      </div>
    </div>

    <MarkdownRenderer :value="aiWriterMarkdown" />

    <FlowButton
      v-if="aiWriterMarkdown"
      label="Turn into API Docs"
      variant="outlined"
      @click="handleCreatePage" />
  </div>
</template>
<style scoped>
.swagger-ai-writer {
  padding: 24px;
}
.swagger-ai-writer :deep(.aiwriter span i) {
  display: none;
}
.swagger-ai-writer :deep(.page-node > .guide-node-component:first-of-type h1) {
  margin-top: 0;
}
.aiwriter {
  text-align: left;
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
}

.aiwriter input::placeholder {
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-family: var(--theme-font, var(--default-theme-font));
}

.aiwriter input:-ms-input-placeholder {
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-family: var(--theme-font, var(--default-theme-font));
}

.aiwriter input::-webkit-input-placeholder {
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-family: var(--theme-font, var(--default-theme-font));
}

.aiwriter-input {
  appearance: none;
  outline: none;
  background: transparent;
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-size: var(--theme-font-size-3, var(--default-theme-font-size-3));
  padding: 9px;
  border: none;
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}

.aiwriter-input:last-of-type {
  border-bottom: none;
}

.aiwriter-input + .aiwriter-input {
  border-top: none;
}

.aiwriter-input::placeholder {
  color: var(--theme-color-3, var(--deafult-theme-color-3));
}

.aiwriter-input:first-of-type:placeholder-shown {
  opacity: 0;
}

.aiwriter-input:first-of-type:focus {
  opacity: 1;
}

.aiwriter-input:focus-within ~ div,
.aiwriter-input:not(:placeholder-shown) ~ div {
  display: none;
}

.aiwriter-input:focus {
  box-shadow: 0 0 0 1px var(--theme-color-1, var(--default-theme-color-1));
}

.aiwriter-input:first-of-type {
  border-radius: var(--theme-radius, var(--default-theme-radius))
    var(--theme-radius, var(--default-theme-radius)) 0 0;
}

.aiwriter-input:last-of-type {
  border-radius: 0 0 var(--theme-radius, var(--default-theme-radius))
    var(--theme-radius, var(--default-theme-radius));
}

.aiwriter-input:first-of-type:last-of-type {
  border-radius: var(--theme-radius, var(--default-theme-radius));
}
.swagger-ai-writer-inputs {
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
}
.swagger-ai-writer-inputs-container :deep(.flow-label) {
  background: var(--theme-background-2, var(--default-theme-background-2));
  box-shadow: 0 0 2px 2px
    var(--theme-background-2, var(--default-theme-background-2));
}
.swagger-ai-writer-inputs-container {
  padding: 0 24px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.animated-input {
  position: absolute;
  white-space: nowrap;
  background: var(
    --theme-background-2,
    var(--default-theme-background-2)
  ) !important;
  pointer-events: none;
}
.animated-input span {
  font-size: var(--theme-font-size-3, var(--default-theme-font-size-3));
  color: var(--theme-color-3, var(--default-theme-color-3));
  position: absolute;
  pointer-events: none;
  left: 9px;
  top: 9px;
  opacity: 0;
}
.animated-input span:nth-of-type(1) {
  opacity: 1;
  animation: flipin1 10s ease-in-out infinite;
}

@keyframes flipin1 {
  27%,
  100% {
    opacity: 0;
    transform: translate3d(0, 3px, 0);
  }
  0%,
  25% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  27% {
    opacity: 0;
    transform: translate3d(0, -3px, 0);
  }
}
.animated-input span:nth-of-type(2) {
  opacity: 0;
  animation: flipin2 10s ease-in-out infinite;
}

@keyframes flipin2 {
  0%,
  25%,
  100% {
    opacity: 0;
    transform: translate3d(0, 3px, 0);
  }
  27%,
  50% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  52% {
    opacity: 0;
    transform: translate3d(0, -3px, 0);
  }
}
.animated-input span:nth-of-type(3) {
  opacity: 0;
  animation: flipin3 10s ease-in-out infinite;
}

@keyframes flipin3 {
  0%,
  50%,
  100% {
    opacity: 0;
    transform: translate3d(0, 3px, 0);
  }
  52%,
  75% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  77% {
    opacity: 0;
    transform: translate3d(0, -3px, 0);
  }
}
.animated-input span:nth-of-type(4) {
  opacity: 0;
  animation: flipin4 10s ease-in-out infinite;
}

@keyframes flipin4 {
  0%,
  75% {
    opacity: 0;
    transform: translate3d(0, 3px, 0);
  }
  77%,
  98% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  100% {
    opacity: 0;
    transform: translate3d(0, -3px, 0);
  }
}
</style>
