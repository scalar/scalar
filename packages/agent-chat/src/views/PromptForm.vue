<script setup lang="ts">
import { ChatComposer } from '@scalar/chat'
import { ScalarIconButton } from '@scalar/components/icon-button'
import { ScalarTooltip } from '@scalar/components/tooltip'
import {
  ScalarIconCheck,
  ScalarIconLockSimple,
  ScalarIconX,
} from '@scalar/icons'
import { computed, useTemplateRef } from 'vue'

// TODO: The add-API affordances (the plus button popovers and the
// "Load additional APIs" row) are temporarily disabled. Restore these
// imports together with the commented template blocks below.
// import ActionsDropdown from '@/components/ActionsDropdown.vue'
// import SearchPopover from '@/components/SearchPopover.vue'
import ApprovalSection from '@/components/ApprovalSection.vue'
import ErrorMessageMessage from '@/components/ErrorMessage.vue'
import FreeMessagesInfoSection from '@/components/FreeMessagesInfoSection.vue'
import PaymentSection from '@/components/PaymentSection.vue'
import UploadSection from '@/components/UploadSection.vue'
import { AgentErrorCodes } from '@/entities/error/constants'
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

const composerRef =
  useTemplateRef<InstanceType<typeof ChatComposer>>('composer')

const state = useState()

/** Show free messages info only after at least one message has been sent and when no API key is set. */
const showFreeMessagesInfo = computed(
  () =>
    state.chat.messages.length > 1 &&
    !state.getAgentKey?.() &&
    chatError?.value?.code !== AgentErrorCodes.LIMIT_REACHED,
)

function focusPrompt() {
  composerRef.value?.focus()
}

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

const isPending = computed(() =>
  Object.values(state.pendingDocuments).some(Boolean),
)

/** Whether a response is in flight, for the composer's Send/Stop morph. */
const isResponding = computed(
  () => state.chat.status === 'submitted' || state.chat.status === 'streaming',
)

/**
 * The surface's extra send gates. The composer blocks empty and over-limit
 * submits on its own, but the empty draft is included here so the button
 * renders its disabled treatment, matching agent.scalar.com.
 */
const sendDisabled = computed(() => {
  const emptyDraft = !state.prompt.value.trim()

  const awaitingApproval = approvalRequiredParts.value.length > 0
  const pendingToolParts = pendingClientToolParts.value.length > 0

  const isPreview = state.mode === 'preview'

  const termsNotAccepted = isPreview && !state.terms.accepted.value
  const uploadingTmpDoc = isPreview && !!uploadTmpDoc.uploadState.value

  return (
    emptyDraft ||
    awaitingApproval ||
    pendingToolParts ||
    termsNotAccepted ||
    uploadingTmpDoc ||
    isPending.value
  )
})

function handleSubmit() {
  if (sendDisabled.value) {
    return
  }

  emit('submit')
}

function handleStop() {
  void state.chat.stop()
}

const chatError = useChatError()
</script>

<template>
  <div class="actionContainer">
    <UploadSection
      v-if="uploadTmpDoc.uploadState.value || isPending"
      :uploadState="uploadTmpDoc.uploadState.value ?? { type: 'loading' }" />
    <ErrorMessageMessage
      v-if="chatError"
      :error="chatError" />
    <ApprovalSection
      v-if="approvalRequiredParts.length"
      @approve="respondToRequestApprovals(true)"
      @reject="respondToRequestApprovals(false)" />
    <PaymentSection v-if="chatError?.code === AgentErrorCodes.LIMIT_REACHED" />
    <FreeMessagesInfoSection v-if="showFreeMessagesInfo" />
    <ChatComposer
      ref="composer"
      v-model="state.prompt.value"
      class="promptComposer"
      :sendDisabled="sendDisabled"
      :streaming="isResponding"
      @stop="handleStop"
      @submit="handleSubmit">
      <template #actionsStart>
        <!-- TODO: The add-API button is temporarily disabled together with
          the "Load additional APIs" row below.
        <template v-if="!state.hideAddApi">
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
        </template>
        -->
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
        <!-- Pushes the settings/terms cluster against the send control. -->
        <div class="actionsSpacer" />
        <ScalarTooltip content="Settings">
          <ScalarIconButton
            class="settingsButton h-7 w-7 p-1.5"
            :icon="ScalarIconLockSimple"
            label="Scalar"
            size="md"
            weight="bold"
            @click="state.settingsModal.show()" />
        </ScalarTooltip>
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
        </div>
      </template>
    </ChatComposer>

    <!-- TODO: The "Load additional APIs" row is temporarily disabled.
    <div
      v-if="state.chat.messages.length <= 1 && !state.hideAddApi"
      class="addMoreContext">
      <span>Load additional APIs</span>
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
    -->
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
  border-radius: var(--scalar-radius-3xl);
  width: 100%;
  position: relative;
  /* TODO: Restore together with the "Load additional APIs" row below, whose
     overflowing text this solid shadow masked:
     box-shadow: 0 24px 0 2px var(--scalar-background-1); */
}

/* The kit composer's input box adopts the shell's rounding. */
.promptComposer :deep(.chat-composer-input) {
  border-radius: var(--scalar-radius-3xl);
  box-shadow: var(--scalar-shadow-1);
}

.promptComposer :deep(.chat-composer-field) {
  min-height: 64px;
  max-height: 250px;
  padding: 12px 14px 4px;
}

.actionsSpacer {
  flex: 1;
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
  border-radius: var(--scalar-radius-full);
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

.apiPill {
  font-size: var(--scalar-font-size-3);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  color: var(--scalar-color-2);
  font-weight: var(--scalar-semibold);
  height: 28px;
  align-items: center;
  display: flex;
  border-radius: var(--scalar-radius-3xl);
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
  border-radius: var(--scalar-radius-full);
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

.settingsButton {
  color: var(--scalar-color-3) !important;
  border-radius: var(--scalar-radius-full) !important;
  margin: 0 !important;
  z-index: 1;
}
.settingsButton[aria-disabled='true'] {
  background: var(--scalar-background-2);
}
.dark-mode .settingsButton:hover {
  background: var(--scalar-background-3);
}

.sendCheckboxContinue:has(input) {
  display: flex;
  align-items: center;
  border-radius: var(--scalar-radius-3xl);
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
  border-radius: var(--scalar-radius-full);
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
  border-radius: var(--scalar-radius-3xl);
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
  border-radius: var(--scalar-radius-full);
  background: var(--scalar-background-2);
}
</style>
