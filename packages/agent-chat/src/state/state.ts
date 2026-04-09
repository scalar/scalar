import { Chat } from '@ai-sdk/vue'
import { type ModalState, useModal } from '@scalar/components'
import { type ApiReferenceConfigurationRaw, apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { useToasts } from '@scalar/use-toasts'
import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { DefaultChatTransport, type UIDataTypes, type UIMessage, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { n } from 'neverpanic'
import { type ComputedRef, type InjectionKey, type Ref, computed, inject, reactive, ref, watch } from 'vue'

import { type Api, createApi, createAuthorizationHeaders } from '@/api'
import { executeRequestTool } from '@/client-tools/execute-request'
import { URLS } from '@/consts/urls'
import { createError } from '@/entities'
import type { ApiMetadata } from '@/entities/registry/document'
import type {
  ASK_FOR_AUTHENTICATION_TOOL_NAME,
  AskForAuthenticationInput,
} from '@/entities/tools/ask-for-authentication'
import {
  EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME,
  type ExecuteClientSideRequestToolInput,
  type ExecuteClientSideRequestToolOutput,
} from '@/entities/tools/execute-request'
import type {
  GetOpenAPISpecsSummaryToolOutput,
  SUMMARIZE_OPENAPI_SPECS_TOOL_NAME,
} from '@/entities/tools/get-openapi-specs-summary'
import type {
  SEARCH_OPENAPI_OPERATIONS_TOOL_NAME,
  SearchOpenAPIOperationsToolInput,
  SearchOpenAPIOperationsToolOutput,
} from '@/entities/tools/search-openapi-operations'
import { createDocumentSettings } from '@/helpers'
import { useTermsAndConditions } from '@/hooks/use-term-and-conditions'
import { removeTmpDocFromLocalStorage } from '@/hooks/use-upload-tmp-document'
import { persistencePlugin } from '@/plugins/persistance'
import { loadDocument } from '@/registry/add-documents-to-store'
import { createDocumentName } from '@/registry/create-document-name'
import type { ChatMode } from '@/types'

export type RegistryDocument = {
  namespace: string
  slug: string
}

export type Tools = {
  [SEARCH_OPENAPI_OPERATIONS_TOOL_NAME]: {
    input: SearchOpenAPIOperationsToolInput
    output: SearchOpenAPIOperationsToolOutput
  }
  [EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME]: {
    input: ExecuteClientSideRequestToolInput
    output: ExecuteClientSideRequestToolOutput
  }
  [SUMMARIZE_OPENAPI_SPECS_TOOL_NAME]: {
    input: object
    output: GetOpenAPISpecsSummaryToolOutput
  }
  [ASK_FOR_AUTHENTICATION_TOOL_NAME]: {
    input: AskForAuthenticationInput
    output: unknown
  }
}

export const STATE_SYMBOL: InjectionKey<State> = Symbol('STATE_SYMBOL')

const { toast } = useToasts()

type State = {
  prompt: Ref<string>
  chat: Chat<UIMessage<unknown, UIDataTypes, Tools>>
  workspaceStore: WorkspaceStore
  loading: ComputedRef<boolean>
  settingsModal: ModalState
  eventBus: WorkspaceEventBus
  proxyUrl: ComputedRef<string>
  proxyUrlRaw: Ref<string | undefined>
  config: ComputedRef<ApiReferenceConfigurationRaw>
  registryUrl: string
  dashboardUrl: string
  baseUrl: string
  platformProxyUrl: string
  isLoggedIn?: Ref<boolean>
  registryDocuments: Ref<ApiMetadata[]>
  pendingDocuments: Record<string, boolean>
  mode: ChatMode
  terms: { accepted: Ref<boolean>; accept: () => void }
  addDocument: (document: { namespace: string; slug: string; removable?: boolean; tmp?: boolean }) => Promise<void>
  addDocumentAsync: (document: { namespace: string; slug: string; removable?: boolean }) => Promise<void>
  removeDocument: (document: { namespace: string; slug: string }) => void
  getAccessToken?: () => string
  getAgentKey?: () => string
  api: Api
  uploadedTmpDocumentUrl: Ref<string | undefined>
  curatedDocuments: Ref<ApiMetadata[]>
  getActiveDocumentJson?: () => string
  hideAddApi?: boolean
}

function createChat({
  registryDocuments,
  workspaceStore,
  baseUrl,
  proxyUrl,
  getAccessToken,
  getAgentKey,
}: {
  registryDocuments: Ref<ApiMetadata[]>
  workspaceStore: WorkspaceStore
  baseUrl: string
  proxyUrl: ComputedRef<string>
  getAccessToken?: () => string
  getAgentKey?: () => string
}) {
  const chat = new Chat<UIMessage<unknown, UIDataTypes, Tools>>({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport: new DefaultChatTransport({
      api: `${baseUrl}/vector/openapi/chat`,
      headers: () => createAuthorizationHeaders({ getAccessToken, getAgentKey }),
      body: () => ({
        registryDocuments: registryDocuments.value,
      }),
    }),
    async onToolCall({ toolCall }): Promise<any> {
      if (toolCall.dynamic) {
        return
      }

      if (
        toolCall.toolName === EXECUTE_CLIENT_SIDE_REQUEST_TOOL_NAME &&
        toolCall.input.method.toLowerCase() === 'get'
      ) {
        await executeRequestTool({
          documentSettings: createDocumentSettings(workspaceStore),
          input: toolCall.input,
          toolCallId: toolCall.toolCallId,
          chat,
          proxyUrl: proxyUrl.value,
        })
      }
    },
  })

  return chat
}

export function createState({
  initialRegistryDocuments,
  registryUrl,
  dashboardUrl,
  platformProxyUrl,
  baseUrl,
  mode,
  isLoggedIn,
  getAccessToken,
  getAgentKey,
  getActiveDocumentJson,
  prefilledMessageRef,
  hideAddApi,
}: {
  initialRegistryDocuments: { namespace: string; slug: string }[]
  registryUrl: string
  dashboardUrl: string
  platformProxyUrl: string
  baseUrl: string
  mode: ChatMode
  isLoggedIn?: Ref<boolean>
  getAccessToken?: () => string
  getAgentKey?: () => string
  getActiveDocumentJson?: () => string
  prefilledMessageRef?: Ref<string>
  hideAddApi?: boolean
}): State {
  const prompt = ref<State['prompt']['value']>(prefilledMessageRef?.value ?? '')
  const registryDocuments = ref<ApiMetadata[]>([])
  const pendingDocuments = reactive<Record<string, boolean>>({})
  const curatedDocuments = ref<ApiMetadata[]>([])
  const proxyUrlRaw = ref<State['proxyUrlRaw']['value']>(URLS.DEFAULT_PROXY_URL)
  const proxyUrl = computed(() => proxyUrlRaw.value?.trim() || URLS.DEFAULT_PROXY_URL)
  const uploadedTmpDocumentUrl = ref<string>()
  const terms = useTermsAndConditions()

  const eventBus = createWorkspaceEventBus()
  const workspaceStore = createWorkspaceStore({
    plugins: [
      persistencePlugin({
        persistAuth: true,
      }),
    ],
  })

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
    proxyUrl,
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

  if (prefilledMessageRef) {
    watch(prefilledMessageRef, async (val) => {
      if (val) {
        prompt.value = val
        if (terms.accepted.value) {
          await chat.sendMessage({ text: prompt.value })
        }
      }
    })
  }

  const settingsModal = useModal()

  async function addDocument({
    namespace,
    slug,
    removable = true,
    tmp = false,
  }: {
    namespace: string
    slug: string
    removable?: boolean
    tmp?: boolean
  }) {
    const matchingDoc = registryDocuments.value.find((doc) => doc.namespace === namespace && doc.slug === slug)

    if (matchingDoc) {
      return
    }

    const identifier = `@${namespace}/${slug}`

    pendingDocuments[identifier] = true

    const loadDocumentResult = await loadDocument({
      namespace,
      slug,
      workspaceStore,
      registryUrl,
      registryDocuments,
      config: config.value,
      api,
      removable,
    })

    pendingDocuments[identifier] = false

    if (!loadDocumentResult.success) {
      /**
       * If we are unable to load a document, we just remove it
       * from tmp local storage, do not warn the user.
       */
      if (tmp) {
        removeTmpDocFromLocalStorage()
        throw loadDocumentResult.error
      }

      console.warn('[AGENT]: Unable to load document', loadDocumentResult.error)
      toast(`Unable to load the document @${namespace}/${slug}`, 'warn')
      throw loadDocumentResult.error
    }
  }

  /**
   * Waits for document to be available in embeddings
   * and adds to the list
   */
  async function addDocumentAsync({
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

    const identifier = `@${namespace}/${slug}`

    pendingDocuments[identifier] = true

    const embeddingStatusResponse = await n.fromUnsafe(
      () =>
        fetch(`${baseUrl}/vector/registry/embeddings/${namespace}/${slug}`, {
          method: 'GET',
        }),
      (originalError) => createError('FAILED_TO_GET_EMBEDDING_STATUS', originalError),
    )

    if (embeddingStatusResponse.success && embeddingStatusResponse.data.ok) {
      const loadDocumentResult = await loadDocument({
        namespace,
        slug,
        workspaceStore,
        registryUrl,
        registryDocuments,
        config: config.value,
        api,
        removable,
      })

      if (!loadDocumentResult.success) {
        console.warn('[AGENT]: Unable to load document', loadDocumentResult.error)
        toast(`Unable to load the document @${namespace}/${slug}`, 'warn')
      }
    } else {
      console.warn('[AGENT]: Document could not be embedded')
      toast(`Unable to embed the document @${namespace}/${slug}`, 'warn')
    }

    pendingDocuments[identifier] = false
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
    eventBus,
    loading,
    settingsModal,
    config,
    registryUrl,
    dashboardUrl,
    platformProxyUrl,
    baseUrl,
    registryDocuments,
    pendingDocuments,
    proxyUrl,
    proxyUrlRaw,
    mode,
    terms,
    isLoggedIn,
    addDocument,
    addDocumentAsync,
    removeDocument,
    getAccessToken,
    getAgentKey,
    api,
    uploadedTmpDocumentUrl,
    curatedDocuments,
    getActiveDocumentJson,
    hideAddApi,
  }
}

export function useState() {
  const state = inject(STATE_SYMBOL)

  if (!state) {
    throw new Error('No state provided.')
  }

  return state
}
