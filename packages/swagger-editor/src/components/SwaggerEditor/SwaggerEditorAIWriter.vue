<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue'

import FlowButton, { useLoadButtonState } from '../FlowButton.vue'
import FlowTextField from '../FlowTextField.vue'
import TheHuman from './TheHuman.vue'

// defineProps<{ content: string }>()
const emits = defineEmits<{
  (event: 'startAIWriter', value: string[]): void
}>()

const loadingState = useLoadButtonState()
const title = ref('')

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
const output = ref('')

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
  console.log(state.steps)
  emits('startAIWriter', state.steps)
  setTimeout(() => {
    loadingState.stopLoading()
    output.value = '# This is the output && # markdown'
  }, 2000)
}
async function handleCreatePage() {
  return {}
}
</script>
<template>
  <div class="swagger-ai-writer gap-1 flex-col">
    <TheHuman>
      <template #title>
        <h1>AI Writer</h1>
      </template>
      <template #description>
        Swagger ai writer makes it easy to write high quality documentation,
        take it for a spin to try it out today!
      </template>
    </TheHuman>
    <FlowTextField
      v-model="title"
      autofocus
      label="Title"
      placeholder="Getting Started" />
    <div class="ai-content ai-content__show">
      <input
        v-for="(step, index) in state.steps"
        :key="index"
        ref="itemRefs"
        class="ai-content-input"
        placeholder="i.e How to Create a User"
        type="text"
        :value="step"
        @input="state.setStep(index, ($event.target as HTMLInputElement).value)"
        @keydown.delete="step === '' ? state.spliceStep(index) : () => {}"
        @keydown.enter="nextStep?.focus()" />
      <input
        ref="nextStep"
        v-model="extraStep"
        class="ai-content-input"
        placeholder="i.e How to Create a User"
        type="text"
        @input="extraStepHandler" />
      <span> AI Section Prompts <i> (Optional)</i> </span>
    </div>
    <FlowButton
      label="Generate Content"
      :loaderState="loadingState"
      @click="sendContentCreationRequest" />

    <div v-html="output"></div>

    <FlowButton
      v-if="output"
      label="Turn into API Docs"
      variant="outlined"
      @click="handleCreatePage" />
  </div>
</template>
<style scoped>
.swagger-ai-writer {
  padding: 30px;
}
.swagger-ai-writer :deep(.ai-content span i) {
  display: none;
}
.swagger-ai-writer :deep(.page-node > .guide-node-component:first-of-type h1) {
  margin-top: 0;
}
</style>
<style lang="postcss" scoped>
.ai-content {
  text-align: left;
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: var(--theme-radius);
  border: var(--theme-border);
  span {
    font-size: var(--theme-font-size-3);
    color: var(--theme-color-3);
    display: flex;
    align-items: center;
    position: absolute;
    background: var(--theme-background-1) !important;
    box-shadow: 0 0 2px 2px var(--theme-background-1) !important;
    margin: 12px 6px;
    padding: 0 6px;
    transition: transform 0.2s ease-in-out, font-size 0.2s ease-in-out;
    pointer-events: none;
    i {
      margin-left: 3px;
    }
    img,
    svg {
      margin-right: 6px;
      width: 14px;
      height: 14px;
    }
  }
  &-input {
    appearance: none;
    outline: none;
    background: transparent;
    color: var(--theme-color-1);
    font-size: var(--theme-font-size-3);
    padding: 11px 12px;
    border-bottom: var(--theme-border);
    &:last-of-type {
      border-bottom: none;
    }
    & + .ai-content-input {
      border-top: none;
    }
    &::placeholder {
      color: var(--theme-color-3);
    }
    &:focus-within ~ span,
    &:not(:placeholder-shown) ~ span {
      transform: translate3d(0, -20px, 0) scale(0.75);
      transform-origin: top left;
      color: var(--theme-color-1);
    }
    &:first-of-type:placeholder-shown {
      opacity: 0;
    }
    &:first-of-type:focus {
      opacity: 1;
    }
  }
  &:focus-within,
  &:focus-within .ai-content-input {
    border-color: var(--theme-color-3);
  }
}
</style>
