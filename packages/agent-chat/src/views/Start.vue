<script setup lang="ts">
import {
  ScalarIconBook,
  ScalarIconListMagnifyingGlass,
  ScalarIconPlayCircle,
} from '@scalar/icons'
import { useTemplateRef } from 'vue'

import { URLS } from '@/consts/urls'
import { useState } from '@/state/state'
import PromptForm from '@/views/PromptForm.vue'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'uploadApi'): void
}>()

const { mode, prompt } = useState()

const promptFormField =
  useTemplateRef<InstanceType<typeof PromptForm>>('promptFormField')

/** Example prompts offered on the empty state, mirroring the other chat surfaces. */
const STARTER_PROMPTS = [
  { label: 'What can I do with this API?', icon: ScalarIconBook },
  {
    label: 'Which endpoints are available?',
    icon: ScalarIconListMagnifyingGlass,
  },
  { label: 'Help me make my first request', icon: ScalarIconPlayCircle },
] as const

/**
 * Prefill the composer instead of sending right away, so the surface's send
 * gates (terms acceptance, pending uploads) still apply to example prompts.
 */
function handleStarter(label: string) {
  prompt.value = label
  promptFormField.value?.focusPrompt()
}
</script>

<template>
  <div class="startContainer">
    <div class="startSuggestions">
      <p class="startTitle">How can I help you today?</p>
      <ul class="startSuggestionList">
        <li
          v-for="starter in STARTER_PROMPTS"
          :key="starter.label"
          class="startSuggestion">
          <button
            class="startSuggestionButton"
            type="button"
            @click="handleStarter(starter.label)">
            <component :is="starter.icon" />
            <span>{{ starter.label }}</span>
          </button>
        </li>
      </ul>
    </div>
    <PromptForm
      ref="promptFormField"
      @submit="emit('submit')"
      @uploadApi="emit('uploadApi')" />
    <p class="disclaimerText">
      <template v-if="mode === 'preview'">
        By messaging Agent Scalar your OpenAPI document will be temporarily
        uploaded to Scalar's servers. You must agree to our
      </template>
      <template v-else>By messaging Agent Scalar you agree to our </template>
      <a
        class="disclaimerLink"
        :href="URLS.TERMS_AND_CONDITIONS"
        target="_blank"
        >Terms</a
      >
      and
      <a
        class="disclaimerLink"
        :href="URLS.PRIVACY_POLICY"
        target="_blank"
        >Privacy Policy</a
      >.
    </p>
  </div>
</template>

<style scoped>
.startContainer {
  display: flex;
  flex-direction: column;
  /* The empty state docks the suggestions and composer at the bottom. */
  justify-content: flex-end;
  width: 100%;
  height: 100%;
  max-width: 720px;
  position: relative;
  padding-bottom: 12px;
}

.startSuggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 0 4px;
  margin-bottom: 12px;
}

.startTitle {
  margin: 0;
  font-size: var(--scalar-font-size-3);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
}

.startSuggestionList {
  display: flex;
  flex-direction: column;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
}

.startSuggestion {
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}

.startSuggestionButton {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 0;
  background: none;
  border: none;
  color: var(--scalar-color-3);
  font-size: var(--scalar-font-size-3);
  line-height: 1.35;
  text-align: left;
  cursor: pointer;
  transition: color 120ms ease;
}

.startSuggestionButton svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.startSuggestionButton:hover {
  color: var(--scalar-color-1);
}

.disclaimerText {
  text-align: center;
  color: var(--scalar-color-3);
  font-size: var(--scalar-font-size-3);
  text-wrap: balance;
  line-height: 1.44;
  margin-top: 16px;
}

.disclaimerLink {
  text-decoration: underline;
}
</style>
