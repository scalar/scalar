<script setup lang="ts">
import { getSelectedServer } from '@scalar/api-client/v2/features/operation'
import { getActiveEnvironment, getServers } from '@scalar/api-client/v2/helpers'
import { ScalarButton } from '@scalar/components'
import { ScalarIconArrowRight } from '@scalar/icons'
import type { ToolUIPart } from 'ai'
import { computed, type Ref } from 'vue'

import AuthenticationProvided from '@/components/AuthenticationProvided.vue'
import AuthenticationRequired from '@/components/AuthenticationRequired.vue'
import { ASK_FOR_AUTHENTICATION_TOOL_NAME } from '@/entities/tools/ask-for-authentication'
import { TOOL_NAMESPACE_SLUG_DELIMITER } from '@/entities/tools/constants'
import { createDocumentName } from '@/registry/create-document-name'
import { useState, type Tools } from '@/state/state'
import Auth from '@/views/Settings/Auth.vue'

const { messagePart } = defineProps<{
  messagePart: Ref<
    ToolUIPart<Pick<Tools, typeof ASK_FOR_AUTHENTICATION_TOOL_NAME>>
  >
}>()

const { workspaceStore, eventBus, config, chat } = useState()

const documentName = computed(() => {
  if (
    !messagePart.value.input?.uniqueIdentifier ||
    messagePart.value.state !== 'input-available'
  ) {
    return
  }

  const [namespace, slug] = messagePart.value.input.uniqueIdentifier.split(
    TOOL_NAMESPACE_SLUG_DELIMITER,
  )
  if (!namespace || !slug) {
    return
  }

  return createDocumentName(namespace, slug)
})

const document = computed(() => {
  if (!documentName.value) {
    return
  }

  return workspaceStore.workspace.documents[documentName.value]
})

const environment = computed(() => {
  if (!document.value) {
    return
  }

  return getActiveEnvironment(workspaceStore, document.value)
})

const selectedServer = computed(() => {
  if (!document.value) {
    return
  }

  const servers = getServers(document.value.servers, {
    documentUrl: document.value['x-scalar-original-source-url'],
  })

  return getSelectedServer(document.value, servers)
})

const isAuthenticationExpanded = computed(
  () => documentName.value && environment.value && selectedServer.value,
)

async function authorizeClicked() {
  await chat.addToolOutput({
    toolCallId: messagePart.value.toolCallId,
    output: 'Authentication provided.',
    tool: ASK_FOR_AUTHENTICATION_TOOL_NAME,
    state: 'output-available',
  })
}
</script>

<template>
  <div
    class="askForAuthentication"
    :class="{
      open: isAuthenticationExpanded,
    }">
    <div class="toggleButton">
      <AuthenticationProvided
        v-if="messagePart.value.state === 'output-available'" />
      <AuthenticationRequired
        v-if="messagePart.value.state === 'input-available'" />
      <ScalarButton
        v-if="messagePart.value.state === 'input-available'"
        class="authorizeButton"
        size="xs"
        @click="authorizeClicked">
        Authorize
        <ScalarIconArrowRight weight="bold" />
      </ScalarButton>
    </div>
    <div class="authContent">
      <div class="authContentInner">
        <Auth
          v-if="documentName && document && environment && selectedServer"
          :authStore="workspaceStore.auth"
          :document
          :environment
          :eventBus
          :name="documentName"
          :options="config"
          :selectedServer />
      </div>
    </div>
  </div>
</template>

<style scoped>
.askForAuthentication {
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  margin-bottom: 12px;
  box-shadow:
    0 var(--scalar-border-width) 0 var(--scalar-background-1),
    0 calc(-1 * var(--scalar-border-width)) 0 var(--scalar-background-1);
  padding: 0;
}

.authContent {
  display: grid;
  grid-template-rows: 0fr;
  min-height: 0;
  overflow: hidden;
  transition: grid-template-rows 0.2s ease-out;
  max-width: 520px;
  margin: auto;
  width: 100%;
}
.authContentInner :deep(> div) {
  margin: 36px 0 48px 0;
}
.authContent :deep(.markdown) {
  margin-bottom: 0 !important;
}
.askForAuthentication.open .authContent {
  grid-template-rows: 1fr;
}

.continueButton {
  align-self: flex-end;
}

.toggleButton {
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  position: relative;
  display: flex;
  align-items: center;
  color: var(--scalar-color-3);
  justify-content: space-between;
  border-radius: var(--scalar-radius-lg);
}

.authContentInner {
  min-height: 0;
  overflow: hidden;
}

.authorizeButton {
  background: var(--scalar-color-blue) !important;
  color: white !important;
  margin: 0 !important;
  z-index: 1;
  display: flex;
  gap: 5px;
}
</style>
