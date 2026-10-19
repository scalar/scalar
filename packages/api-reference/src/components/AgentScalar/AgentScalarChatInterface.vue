<script setup lang="ts">
import { Chat } from '@scalar/agent-chat'
import type {
  ApiReferenceConfigurationWithSource,
  ExternalUrls,
} from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { isAsyncApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { computed, ref, watch, type Ref } from 'vue'

const {
  agentScalarConfiguration,
  externalUrls,
  workspaceStore,
  prefilledMessage,
} = defineProps<{
  agentScalarConfiguration?: ApiReferenceConfigurationWithSource['agent']
  externalUrls: ExternalUrls
  workspaceStore: WorkspaceStore
  prefilledMessage?: Ref<string>
}>()
/** A source change must not reuse the previous document's conversation or agent key. */
const documentJson = computed(
  () => workspaceStore.exportActiveDocument('json') ?? '',
)
/** Include the selected source even when an agent key grants access to several APIs. */
const documentContext = computed(() => {
  const document = workspaceStore.workspace.activeDocument
  if (!document) {
    return undefined
  }
  const format = isAsyncApiDocument(document) ? 'AsyncAPI' : 'OpenAPI'
  return `${document.info.title} (${format}, version ${document.info.version}, source ${workspaceStore.workspace['x-scalar-active-document']})`
})
const sessionKey = computed(() =>
  JSON.stringify([
    workspaceStore.workspace['x-scalar-active-document'],
    documentJson.value,
    agentScalarConfiguration?.key,
  ]),
)
const session = { prefilledMessage: ref(prefilledMessage?.value ?? '') }
watch(
  () => prefilledMessage?.value,
  (message) => {
    session.prefilledMessage.value = message ?? ''
  },
)
watch(
  sessionKey,
  () => {
    session.prefilledMessage.value = ''
  },
  { flush: 'sync' },
)
</script>

<template>
  <Chat
    :key="sessionKey"
    :baseUrl="externalUrls.apiBaseUrl"
    :dashboardUrl="externalUrls.dashboardUrl"
    :getActiveDocumentContext="() => documentContext"
    :getActiveDocumentJson="() => documentJson"
    :getAgentKey="
      agentScalarConfiguration?.key
        ? () => agentScalarConfiguration?.key ?? ''
        : undefined
    "
    :hideAddApi="agentScalarConfiguration?.hideAddApi"
    :mode="agentScalarConfiguration?.key ? 'full' : 'preview'"
    :platformProxyUrl="externalUrls.proxyUrl"
    :prefilledMessage="session.prefilledMessage"
    :registryDocuments="[]"
    :registryUrl="externalUrls.registryUrl" />
</template>
