import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { SelectedSecurity } from '@scalar/workspace-store/entities/auth'
import type { AuthMeta, ServerMeta, WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { OpenApiDocument, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import { type ComputedRef, type MaybeRefOrGetter, computed, toValue } from 'vue'

import { getSecuritySchemes } from '@/v2/blocks/operation-block/helpers/build-request-security'
import {
  type ExecuteOperationRequestResult,
  executeOperationRequest,
} from '@/v2/blocks/operation-block/helpers/execute-operation-request'
import type { ExtendedScalarCookie } from '@/v2/blocks/request-block/RequestBlock.vue'
import { mergeSecurity } from '@/v2/blocks/scalar-auth-selector-block'
import type { MergedSecuritySchemes } from '@/v2/blocks/scalar-auth-selector-block/helpers/merge-security'
import type { SecuritySchemeObjectSecret } from '@/v2/blocks/scalar-auth-selector-block/helpers/secret-types'
import type { ModalProps } from '@/v2/features/modal/Modal.vue'
import { getActiveEnvironment } from '@/v2/helpers/get-active-environment'
import { getActiveProxyUrl } from '@/v2/helpers/get-active-proxy-url'
import { getServers } from '@/v2/helpers/get-servers'
import type { ClientLayout } from '@/v2/types/layout'

import { combineParams } from './helpers/combine-params'
import { getSecurityRequirements } from './helpers/get-security-requirements'
import { getSelectedSecurity } from './helpers/get-selected-security'
import { getSelectedServer } from './helpers/get-selected-server'

/** Unwrapped modal options for server/baseURL (used when computing servers from context). */
type ModalOptionsUnwrapped = Partial<
  Pick<
    ApiReferenceConfigurationRaw,
    'servers' | 'baseServerURL' | 'hideClientButton' | 'authentication' | 'hiddenClients'
  >
>

export type UseOperationRequestContextParams = {
  workspaceStore: MaybeRefOrGetter<WorkspaceStore | null>
  document: MaybeRefOrGetter<OpenApiDocument | null>
  path: MaybeRefOrGetter<string | undefined>
  method: MaybeRefOrGetter<HttpMethod | undefined>
  /** Document slug for auth store lookups */
  documentSlug: MaybeRefOrGetter<string>
  layout: MaybeRefOrGetter<ClientLayout>
  exampleKey?: MaybeRefOrGetter<string>
  eventBus?: MaybeRefOrGetter<WorkspaceEventBus | undefined>
  plugins?: MaybeRefOrGetter<ClientPlugin[]>
  options?: MaybeRefOrGetter<ModalProps['options'] | undefined>
}

export type OperationRequestContext = {
  operation: ComputedRef<OperationObject | null>
  environment: ComputedRef<XScalarEnvironment>
  server: ComputedRef<ServerObject | null>
  servers: ComputedRef<ServerObject[]>
  serverMeta: ComputedRef<ServerMeta>
  proxyUrl: ComputedRef<string>
  globalCookies: ComputedRef<ExtendedScalarCookie[]>
  securitySchemes: ComputedRef<MergedSecuritySchemes>
  documentSelectedSecurity: ComputedRef<SelectedSecurity | undefined>
  operationSelectedSecurity: ComputedRef<SelectedSecurity | undefined>
  selectedSecuritySchemes: ComputedRef<SecuritySchemeObjectSecret[]>
  environments: ComputedRef<string[]>
  activeEnvironment: ComputedRef<string | undefined>
  authMeta: ComputedRef<AuthMeta>
  executeRequest: () => Promise<ExecuteOperationRequestResult>
}

/**
 * Factory that derives environment, server, auth, and execution from workspace + document + path + method.
 * Returns reactive context (environment, server, operation, etc.) and an executeRequest function
 * so the operation block can render and run requests without receiving all derived props.
 */
export function useOperationRequestContext(params: UseOperationRequestContextParams): OperationRequestContext {
  const { workspaceStore, document, path, method, documentSlug, layout, exampleKey, eventBus, plugins, options } =
    params

  const pathItem = computed(() => {
    const p = toValue(path)
    if (!p) {
      return null
    }
    return getResolvedRef(toValue(document)?.paths?.[p])
  })

  const operation = computed(() => {
    const p = toValue(path)
    const m = toValue(method)
    const doc = toValue(document)
    if (!p || !m) {
      return null
    }
    const op = getResolvedRef(doc?.paths?.[p]?.[m])
    if (!op) {
      return null
    }
    const pathItemVal = pathItem.value
    if (!pathItemVal) {
      return op
    }
    const parameters = combineParams(pathItemVal.parameters, op.parameters)
    return { ...op, parameters }
  })

  const environment = computed(() => {
    return getActiveEnvironment(toValue(workspaceStore), toValue(document))
  })

  const activeEnvironment = computed(() => {
    return toValue(workspaceStore)?.workspace['x-scalar-active-environment']
  })

  const globalCookies = computed(() => {
    const store = toValue(workspaceStore)
    const doc = toValue(document)
    return [
      ...((store?.workspace?.['x-scalar-cookies'] ?? []).map((it) => ({
        ...it,
        location: 'workspace',
      })) satisfies ExtendedScalarCookie[]),
      ...((doc?.['x-scalar-cookies'] ?? []).map((it) => ({
        ...it,
        location: 'document',
      })) satisfies ExtendedScalarCookie[]),
    ]
  })

  const servers = computed(() => {
    const doc = toValue(document)
    const op = operation.value
    const opts = toValue(options) as ModalOptionsUnwrapped | undefined
    const _servers = opts?.servers ?? op?.servers ?? doc?.servers
    return getServers(_servers, {
      baseServerUrl: opts?.baseServerURL,
      documentUrl: doc?.['x-scalar-original-source-url'],
    })
  })

  const selectedServerUrl = computed(() => {
    const doc = toValue(document)
    const op = operation.value
    const opts = toValue(options) as ModalOptionsUnwrapped | undefined
    if (opts?.servers != null) {
      return doc?.['x-scalar-selected-server']
    }
    if (op?.servers != null) {
      return op['x-scalar-selected-server']
    }
    return doc?.['x-scalar-selected-server']
  })

  const server = computed(() => {
    return getSelectedServer(servers.value, selectedServerUrl.value)
  })

  const serverMeta = computed<ServerMeta>(() => {
    const op = operation.value
    const p = toValue(path)
    const m = toValue(method)
    if (op?.servers != null) {
      return { type: 'operation', path: p ?? '', method: m ?? 'get' }
    }
    return { type: 'document' } as const
  })

  const securitySchemes = computed(() => {
    const store = toValue(workspaceStore)
    const doc = toValue(document)
    const slug = toValue(documentSlug)
    if (!store?.auth) {
      return {} as MergedSecuritySchemes
    }
    return mergeSecurity(doc?.components?.securitySchemes ?? {}, {}, store.auth, slug)
  })

  const documentSelectedSecurity = computed(() => {
    const store = toValue(workspaceStore)
    const slug = toValue(documentSlug)
    return store?.auth.getAuthSelectedSchemas({
      type: 'document',
      documentName: slug,
    })
  })

  const operationSelectedSecurity = computed(() => {
    const store = toValue(workspaceStore)
    const slug = toValue(documentSlug)
    const p = toValue(path)
    const m = toValue(method)
    return store?.auth.getAuthSelectedSchemas({
      type: 'operation',
      documentName: slug,
      path: p ?? '',
      method: m ?? 'get',
    })
  })

  const securityRequirements = computed(() =>
    getSecurityRequirements(toValue(document)?.security ?? [], operation.value?.security),
  )

  const selectedSecurity = computed(() =>
    getSelectedSecurity(documentSelectedSecurity.value, operationSelectedSecurity.value, securityRequirements.value),
  )

  const selectedSecuritySchemes = computed(() =>
    getSecuritySchemes(securitySchemes.value, selectedSecurity.value.selectedSchemes),
  )

  const environments = computed(() => {
    const doc = toValue(document)
    const store = toValue(workspaceStore)
    return Array.from(
      new Set(
        Object.keys({
          ...doc?.['x-scalar-environments'],
          ...store?.workspace['x-scalar-environments'],
        }),
      ),
    )
  })

  const proxyUrl = computed(() => {
    const store = toValue(workspaceStore)
    const layoutVal = toValue(layout)
    return getActiveProxyUrl(store?.workspace['x-scalar-active-proxy'], layoutVal) ?? ''
  })

  const authMeta = computed<AuthMeta>(() => {
    if (operationSelectedSecurity.value !== undefined) {
      return {
        type: 'operation',
        path: toValue(path) ?? '',
        method: toValue(method) ?? 'get',
      }
    }
    return { type: 'document' } as const
  })

  function executeRequest(): Promise<ExecuteOperationRequestResult> {
    const doc = toValue(document)
    const op = operation.value
    const p = toValue(path)
    const m = toValue(method)
    const key = toValue(exampleKey) ?? 'default'
    const store = toValue(workspaceStore)
    const bus = toValue(eventBus)
    const plug = toValue(plugins) ?? []

    if (!doc || !op || !p || !m) {
      return Promise.resolve({
        error: { message: 'Missing document, operation, path, or method.' },
        result: null,
        controller: new AbortController(),
        variablesStore: undefined,
      })
    }

    return executeOperationRequest({
      document: doc,
      operation: op,
      path: p,
      method: m,
      exampleKey: key,
      environment: environment.value,
      server: server.value,
      proxyUrl: proxyUrl.value,
      globalCookies: globalCookies.value,
      selectedSecuritySchemes: selectedSecuritySchemes.value,
      plugins: plug,
      eventBus: bus,
      workspaceStore: store ?? undefined,
      activeEnvironmentName: activeEnvironment.value,
    })
  }

  return {
    operation,
    environment,
    server,
    servers,
    serverMeta,
    proxyUrl,
    globalCookies,
    securitySchemes,
    documentSelectedSecurity,
    operationSelectedSecurity,
    selectedSecuritySchemes,
    environments,
    activeEnvironment,
    authMeta,
    executeRequest,
  }
}
