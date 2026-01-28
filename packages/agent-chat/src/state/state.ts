import { Chat } from '@ai-sdk/vue'
import { type ModalState, useModal } from '@scalar/components'
import { type ApiReferenceConfigurationRaw, apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  DefaultChatTransport,
  type UIDataTypes,
  type UIMessage,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from 'ai'
import { type ComputedRef, type InjectionKey, type Ref, computed, inject, ref, watch } from 'vue'

import { type Api, createApi, createAuthorizationHeaders } from '@/api'
import type { ApiMetadata } from '@/entities/registry/document'
import type {
  ASK_FOR_AUTHENTICATION_TOOL_NAME,
  AskForAuthenticationInput,
} from '@/entities/tools/ask-for-authentication'
import type {
  EXECUTE_REQUEST_TOOL_NAME,
  ExecuteRequestToolInput,
  ExecuteRequestToolOutput,
} from '@/entities/tools/execute-request'
import type {
  GET_MINI_OPENAPI_SPEC_TOOL_NAME,
  GetMiniOpenAPIDocToolInput,
  GetMiniOpenAPIDocToolOutput,
} from '@/entities/tools/get-mini-openapi-spec'
import type {
  GET_OPENAPI_SPECS_SUMMARY_TOOL_NAME,
  GetOpenAPISpecsSummaryToolOutput,
} from '@/entities/tools/get-openapi-spec-summary'
import { createDocumentSettings, makeScalarProxyUrl } from '@/helpers'
import { useTermsAndConditions } from '@/hooks/use-term-and-conditions'
import { loadDocument } from '@/registry/add-documents-to-store'
import { createDocumentName } from '@/registry/create-document-name'
import type { ChatMode } from '@/types'

export type RegistryDocument = {
  namespace: string
  slug: string
}

export type Tools = {
  [GET_MINI_OPENAPI_SPEC_TOOL_NAME]: {
    input: GetMiniOpenAPIDocToolInput
    output: GetMiniOpenAPIDocToolOutput
  }
  [EXECUTE_REQUEST_TOOL_NAME]: {
    input: ExecuteRequestToolInput
    output: ExecuteRequestToolOutput
  }
  [GET_OPENAPI_SPECS_SUMMARY_TOOL_NAME]: {
    input: object
    output: GetOpenAPISpecsSummaryToolOutput
  }
  [ASK_FOR_AUTHENTICATION_TOOL_NAME]: {
    input: AskForAuthenticationInput
    output: unknown
  }
}

export const STATE_SYMBOL: InjectionKey<State> = Symbol('STATE_SYMBOL')

type State = {
  prompt: Ref<string>
  chat: Chat<UIMessage<unknown, UIDataTypes, Tools>>
  workspaceStore: WorkspaceStore
  loading: ComputedRef<boolean>
  settingsModal: ModalState
  eventBus: WorkspaceEventBus
  proxyUrl: Ref<string | undefined>
  config: ComputedRef<ApiReferenceConfigurationRaw>
  registryUrl: string
  dashboardUrl: string
  baseUrl: string
  registryDocuments: Ref<ApiMetadata[]>
  mode: ChatMode
  terms: { accepted: Ref<boolean>; accept: () => void }
  addDocument: (document: { namespace: string; slug: string; removable?: boolean }) => Promise<void>
  removeDocument: (document: { namespace: string; slug: string }) => void
  getAccessToken?: () => string
  getAgentKey?: () => string
  api: Api
  uploadedTmpDocumentUrl: Ref<string | undefined>
}

function createChat({
  registryDocuments,
  workspaceStore,
  baseUrl,
  getAccessToken,
  getAgentKey,
}: {
  registryDocuments: Ref<ApiMetadata[]>
  workspaceStore: WorkspaceStore
  baseUrl: string
  getAccessToken?: () => string
  getAgentKey?: () => string
}) {
  return new Chat<UIMessage<unknown, UIDataTypes, Tools>>({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    transport: new DefaultChatTransport({
      api: makeScalarProxyUrl(`${baseUrl}/vector/openapi/chat`),
      headers: () => createAuthorizationHeaders({ getAccessToken, getAgentKey }),
      body: () => ({
        registryDocuments: registryDocuments.value,
        documentSettings: createDocumentSettings(workspaceStore),
      }),
    }),
  })
}

export function createState({
  initialRegistryDocuments,
  registryUrl,
  dashboardUrl,
  baseUrl,
  mode,
  getAccessToken,
  getAgentKey,
}: {
  initialRegistryDocuments: { namespace: string; slug: string }[]
  registryUrl: string
  dashboardUrl: string
  baseUrl: string
  mode: ChatMode
  getAccessToken?: () => string
  getAgentKey?: () => string
}): State {
  const prompt = ref<State['prompt']['value']>('')
  const registryDocuments = ref<ApiMetadata[]>([])
  const proxyUrl = ref<State['proxyUrl']['value']>('https://proxy.scalar.com')
  const uploadedTmpDocumentUrl = ref<string>()
  const terms = useTermsAndConditions()

  const eventBus = createWorkspaceEventBus()
  const workspaceStore = createWorkspaceStore()

  const config = computed(() =>
    apiReferenceConfigurationSchema.parse({
      proxyUrl: proxyUrl.value,
      persistAuth: true,
    }),
  )

  const chat = createChat({
    registryDocuments,
    workspaceStore,
    baseUrl,
    getAccessToken,
    getAgentKey,
  })

  const api = createApi({
    baseUrl,
    getAccessToken,
    getAgentKey,
  })

  const loading = computed(
    () =>
      chat.status === 'submitted' ||
      (chat.status === 'streaming' && !chat.lastMessage?.parts.some((part) => part.type === 'text')),
  )

  watch(
    () => chat.status,
    () => {
      if (chat.status === 'streaming') {
        prompt.value = ''
      }
    },
  )

  const settingsModal = useModal()

  async function addDocument({
    namespace,
    slug,
    removable = true,
  }: {
    namespace: string
    slug: string
    removable?: boolean
  }) {
    const matchingDoc = registryDocuments.value.find((doc) => doc.namespace === namespace && doc.slug === slug)

    if (matchingDoc) {
      return
    }

    await loadDocument({
      namespace,
      slug,
      workspaceStore,
      registryUrl,
      registryDocuments,
      config: config.value,
      api,
      removable,
    })
  }

  function removeDocument({ namespace, slug }: { namespace: string; slug: string }) {
    registryDocuments.value = registryDocuments.value.filter(
      (doc) => !(doc.namespace === namespace && doc.slug === slug),
    )

    workspaceStore.deleteDocument(createDocumentName(namespace, slug))
  }

  initialRegistryDocuments.forEach(({ namespace, slug }) => addDocument({ namespace, slug, removable: false }))

  return {
    prompt,
    chat,
    workspaceStore,
    loading,
    settingsModal,
    eventBus,
    config,
    registryUrl,
    dashboardUrl,
    baseUrl,
    registryDocuments,
    proxyUrl,
    mode,
    terms,
    addDocument,
    removeDocument,
    getAccessToken,
    getAgentKey,
    api,
    uploadedTmpDocumentUrl,
  }
}

export function useState() {
  const state = inject(STATE_SYMBOL)

  if (!state) {
    throw new Error('No state provided.')
  }

  return state
}
