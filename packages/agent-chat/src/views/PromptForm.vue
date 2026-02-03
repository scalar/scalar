<script setup lang="ts">
import { ScalarIconButton, ScalarLoading } from '@scalar/components'
import {
  ScalarIconArrowUp,
  ScalarIconCheck,
  ScalarIconLockSimple,
  ScalarIconPlus,
  ScalarIconX,
} from '@scalar/icons'
import { computed, useTemplateRef, watch } from 'vue'

import ActionsDropdown from '@/components/ActionsDropdown.vue'
import ApprovalSection from '@/components/ApprovalSection.vue'
import ErrorMessageMessage from '@/components/ErrorMessage.vue'
import FreeMessagesInfoSection from '@/components/FreeMessagesInfoSection.vue'
import PaymentSection from '@/components/PaymentSection.vue'
import SearchPopover from '@/components/SearchPopover.vue'
import UploadSection from '@/components/UploadSection.vue'
import { AgentErrorCodes } from '@/entities/error/constants'
import { MAX_PROMPT_SIZE } from '@/entities/prompt/constants'
import { useRequestApprovals } from '@/hooks/use-chat-approvals'
import { useChatError } from '@/hooks/use-chat-error'
import { useChatPendingClientToolParts } from '@/hooks/use-chat-pending-client-tool-parts'
import { useUploadTmpDocument } from '@/hooks/use-upload-tmp-document'
import { useState } from '@/state/state'

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'uploadApi'): void
}>()

defineExpose({ focusPrompt })

const promptRef = useTemplateRef<HTMLTextAreaElement>('agentPrompt')

const state = useState()

const inputHasContent = computed(() => state.prompt.value.trim().length > 0)
const promptTooLarge = computed(
  () => state.prompt.value.trim().length > MAX_PROMPT_SIZE,
)

/** Show free messages info only after at least one message has been sent and when no API key is set. */
const showFreeMessagesInfo = computed(
  () =>
    state.chat.messages.length > 1 &&
    !state.getAgentKey?.() &&
    chatError?.value?.code !== AgentErrorCodes.LIMIT_REACHED,
)

watch(state.prompt, () => {
  if (!promptRef?.value) {
    return
  }

  if (!state.prompt.value.length) {
    promptRef.value.style.height = '0px'
    return
  }

  promptRef.value.style.height = 'auto'
  promptRef.value.style.height = promptRef.value.scrollHeight + 'px'
})

function handlePromptKeydown(e: KeyboardEvent) {
  if (state.loading.value) {
    return
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
    window.scrollTo(0, document.body.scrollHeight)
  }
}

function focusPrompt() {
  promptRef.value?.focus()
}

watch(
  () => state.chat.status,
  (status) => {
    if (status === 'ready' || status === 'error') {
      promptRef.value?.focus()
    }
  },
)

const { approvalRequiredParts, respondToRequestApprovals } =
  useRequestApprovals()

const { pendingClientToolParts } = useChatPendingClientToolParts()

const uploadTmpDoc = useUploadTmpDocument()

function acceptTerms() {
  state.terms.accept()

  if (state.mode === 'preview' && state.getActiveDocumentJson) {
    uploadTmpDoc.uploadTempDocument(state.getActiveDocumentJson(), true)
  }
}

const submitDisabled = computed(() => {
  const tooLarge = promptTooLarge.value
  const missingInput = !inputHasContent.value
  const awaitingApproval = approvalRequiredParts.value.length > 0
  const pendingToolParts = pendingClientToolParts.value.length > 0

  const isPreview = state.mode === 'preview'

  const termsNotAccepted = isPreview && !state.terms.accepted.value
  const uploadingTmpDoc = isPreview && !!uploadTmpDoc.uploadState.value

  return (
    tooLarge ||
    missingInput ||
    awaitingApproval ||
    pendingToolParts ||
    termsNotAccepted ||
    uploadingTmpDoc
  )
})

function handleSubmit() {
  if (submitDisabled.value) {
    return
  }

  emit('submit')
}

const chatError = useChatError()
</script>

<template>
  <div class="actionContainer">
    <UploadSection
      v-if="
        uploadTmpDoc.uploadState.value || state.pendingDocuments.value.length
      "
      :uploadState="uploadTmpDoc.uploadState.value ?? { type: 'processing' }" />
    <ErrorMessageMessage
      v-if="chatError"
      :error="chatError" />
    <ApprovalSection
      v-if="approvalRequiredParts.length"
      @approve="respondToRequestApprovals(true)"
      @reject="respondToRequestApprovals(false)" />
    <PaymentSection v-if="chatError?.code === AgentErrorCodes.LIMIT_REACHED" />
    <FreeMessagesInfoSection v-if="showFreeMessagesInfo" />
    <form
      class="promptForm"
      @submit.prevent="handleSubmit">
      <label
        class="agentLabel"
        for="agentTextarea">
        Type a Request To get Started
      </label>
      <textarea
        id="agentTextarea"
        ref="agentPrompt"
        v-model="state.prompt.value"
        class="prompt custom-scroll"
        :disabled="state.loading.value"
        name="prompt"
        placeholder="Ask me anything..."
        @keydown="handlePromptKeydown" />
      <div class="inputActionsContainer">
        <div class="inputActionsLeft">
          <SearchPopover v-if="!state.isLoggedIn?.value">
            <button
              class="addAPIButton"
              type="button">
              <ScalarIconPlus
                class="size-4"
                weight="bold" />
            </button>
          </SearchPopover>
          <ActionsDropdown
            v-else
            @uploadApi="$emit('uploadApi')">
            <button
              class="addAPIButton"
              type="button">
              <ScalarIconPlus
                class="size-4"
                weight="bold" />
            </button>
          </ActionsDropdown>
          <div
            v-for="document in state.registryDocuments.value"
            :key="document.id"
            class="apiPill">
            <img
              v-if="document.logoUrl"
              class="apiPillLogo"
              :src="document.logoUrl" />
            {{ document.title }}
            <button
              v-if="document.removable"
              class="apiPillRemove"
              type="button"
              @click="state.removeDocument(document)">
              <ScalarIconX
                class="size-4"
                weight="bold" />
            </button>
          </div>
        </div>

        <div class="inputActionsRight">
          <ScalarIconButton
            v-if="!state.loading.value"
            class="settingsButton h-7 w-7 p-1.5"
            :icon="ScalarIconLockSimple"
            label="Scalar"
            size="md"
            weight="bold"
            @click="state.settingsModal.show()" />
          <div class="sendCheckboxContinue">
            <div
              v-if="!state.terms.accepted.value && state.mode === 'preview'"
              class="relative flex items-center gap-1.5">
              <input
                id="agentTermsAgree"
                class="sr-only"
                type="checkbox"
                @change="acceptTerms" />
              <label
                class="termsAgree"
                for="agentTermsAgree">
                <ScalarIconCheck
                  class="termsAgreeIcon"
                  weight="bold" />
                Agree to Terms & Conditions
              </label>
            </div>
            <ScalarIconButton
              v-if="!state.loading.value"
              class="sendButton h-7 w-7 p-1.5"
              :disabled="submitDisabled"
              :icon="ScalarIconArrowUp"
              label="Scalar"
              size="md"
              type="submit"
              weight="bold" />
            <ScalarLoading
              v-else
              class="loader h-7 w-7"
              :loader="{
                isLoading: state.loading.value,
                isValid: false,
                clear: async () => {},
                invalidate: async () => {},
                isInvalid: false,
                isActive: false,
                validate: async () => {},
                start: () => {},
              }"
              size="2xl" />
          </div>
        </div>
      </div>
    </form>
    <!-- we only show this before the first message gets populated in the chat -->
    <div
      v-show="state.chat.messages.length <= 1"
      class="addMoreContext">
      <span>Add context from dozens of API's</span>
      <div class="ml-auto flex items-center gap-1">
        <button
          v-for="doc of state.curatedDocuments.value"
          :key="doc.id"
          class="addAPIContext"
          type="button"
          @click="state.addDocument(doc)">
          <img
            v-if="doc.logoUrl"
            :alt="doc.title"
            class="size-4"
            :src="doc.logoUrl" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.actionContainer {
  background: color-mix(
    in srgb,
    var(--scalar-background-2),
    var(--scalar-background-1)
  );
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: 16px;
  width: 100%;
  position: relative;
  /* visually hides overflowing text below */
  box-shadow: 0 24px 0 2px var(--scalar-background-1);
}
.promptForm {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--scalar-background-1);
  box-shadow:
    var(--scalar-shadow-1),
    0 0 0 var(--scalar-border-width) var(--scalar-border-color);
  border-radius: 16px;
}

.inputActionsContainer {
  display: flex;
  justify-content: space-between;
  padding: 0 8px 8px 8px;
}

.inputActionsLeft {
  display: flex;
  flex-wrap: wrap; /* key: allows pills to go to next line */
  align-items: center;
  gap: 5px; /* spacing between pills */
}

.inputActionsRight {
  display: flex;
  gap: 5px;
  position: relative;
}

.apiPill {
  font-size: var(--scalar-font-size-3);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  color: var(--scalar-color-2);
  font-weight: var(--scalar-semibold);
  height: 28px;
  align-items: center;
  display: flex;
  border-radius: 16px;
  padding: 0 8px;
  pointer-events: all;
  z-index: 1;
  gap: 4px;
  user-select: none;
}
.apiPillLogo {
  width: 15px;
}

.apiPillRemove {
  width: 24px;
  height: 24px;
  margin-right: -6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.apiPill:hover .apiPillRemove {
  background: var(--scalar-background-2);
}
.dark-mode .apiPill:hover .apiPillRemove {
  background: var(--scalar-background-3);
}

.apiPillRemove:hover {
  color: var(--scalar-color-1);
}

.prompt {
  width: 100%;
  outline: none;
  border: none;
  resize: none;
  field-sizing: content;
  min-height: 64px;
  z-index: 1;
  max-height: 250px;
  max-width: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
  word-wrap: break-word;
  font-family: var(--scalar-font);
  font-size: 16px;
  padding: 12px 12px 14px 12px;
}
.dark-mode .promptForm {
  background: var(--scalar-background-2);
}

.prompt:disabled {
  color: var(--scalar-color-3);
}

.addAPIButton {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--scalar-color-2);
  font-size: var(--scalar-font-size-3);
  height: 28px;
  width: 28px;
  font-weight: var(--scalar-bold);
  border-radius: 100%;
  display: flex;
  align-items: center;
  gap: 4px;
  pointer-events: all;
  z-index: 1;
  box-shadow: 0 0 0 var(--scalar-border-width) var(--scalar-border-color);
}
.addAPIButton:hover {
  background: color-mix(
    in srgb,
    var(--scalar-background-2),
    var(--scalar-background-1)
  );
  box-shadow: 0 0 0 var(--scalar-border-width) var(--scalar-border-color);
}
.dark-mode .addAPIButton:hover {
  background: var(--scalar-background-3);
}

.settingsButton {
  color: var(--scalar-color-3) !important;
  border-radius: 50% !important;
  margin: 0 !important;
  z-index: 1;
}
.settingsButton[aria-disabled='true'] {
  background: var(--scalar-background-2);
}
.dark-mode .settingsButton:hover {
  background: var(--scalar-background-3);
}

.sendButton {
  background: var(--scalar-color-blue) !important;
  border-radius: 50% !important;
  margin: 0 !important;
  z-index: 1;
  border: var(--scalar-border-width) solid var(--scalar-color-blue);
}
.sendButton:not([aria-disabled='true']) {
  color: white !important;
}
.sendButton:not([aria-disabled='true']):hover {
  background: color-mix(
    in srgb,
    var(--scalar-color-blue),
    transparent 10%
  ) !important;
}
.sendButton[aria-disabled='true'] {
  background: var(--scalar-background-2) !important;
  color: var(--scalar-color-3) !important;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
}

.dark-mode .sendButton[aria-disabled='true'] {
  background: var(--scalar-background-3) !important;
}
.contextContainer {
  display: flex;
  width: 100%;
  padding: 10px 12px 12px 12px;
  color: var(--scalar-color-2);
  font-size: var(--scalar-font-size-3);
  user-select: none;
  justify-content: space-between;
}

.settingsButton {
  font-weight: var(--scalar-semibold);
  border-radius: var(--scalar-radius-lg);
  padding: 4px 6px;
  margin: -4px -6px;
}
.settingsButton:hover {
  background: var(--scalar-background-2);
  box-shadow: 0 0 var(--scalar-border-width) 0 var(--scalar-border-color);
  cursor: pointer;
}

.agentLabel {
  font-size: 0px;
  position: absolute;
  width: 100%;
  height: 100%;
  cursor: text;
}
.sendCheckboxContinue:has(input) {
  display: flex;
  align-items: center;
  border-radius: 14px;
  background: var(--scalar-background-2);
  box-shadow: 0 0 0 1.5px var(--scalar-background-2);
  color: var(--scalar-color-2);
  font-size: var(--scalar-font-size-3);
  font-weight: var(--scalar-semibold);
  user-select: none;
  height: 28px;
}
.dark-mode .sendCheckboxContinue:has(input) {
  background: var(--scalar-background-3);
  box-shadow: 0 0 0 1.5px var(--scalar-background-3);
}

.addMoreContext {
  height: 40px;
  display: flex;
  position: relative;
  font-size: var(--scalar-font-size-3);
  color: var(--scalar-color-3);
  padding: 0 8px 0 12px;
  align-items: center;
}
.addMoreContext:before {
  content: '';
  width: 8px;
  height: 8px;
  background: color-mix(
    in srgb,
    var(--scalar-background-1),
    var(--scalar-background-2)
  );
  transform: rotate(45deg);
  left: 18px;
  top: -3px;
  position: absolute;
  box-shadow:
    -0.5px -0.5px 0 var(--scalar-border-color),
    inset 0.5px 0.5px 1px var(--scalar-border-color);
}
.dark-mode .addMoreContext:before {
  box-shadow: -0.5px -0.5px 0 var(--scalar-border-color);
}
.addAPIContext {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
}

.termsAgree {
  display: flex;
  cursor: pointer;
  height: inherit;
  align-items: center;
  border-radius: 14px;
  gap: 5px;
  margin: 0px 5px;
}

.termsAgree:hover {
  color: var(--scalar-color-1);
}

.termsAgree:hover .termsAgreeIcon {
  background: var(--scalar-color-1);
  color: var(--scalar-background-1);
}

.termsAgreeIcon {
  width: inherit;
  height: inherit;
  padding: 2px;
  border-radius: 50%;
  background: var(--scalar-background-2);
}
</style>
