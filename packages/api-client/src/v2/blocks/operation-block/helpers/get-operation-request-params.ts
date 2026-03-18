import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { SelectedSecurity } from '@scalar/workspace-store/entities/auth'
import type { AuthMeta, ServerMeta } from '@scalar/workspace-store/events'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { OpenApiDocument, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'

import { mergeSecurity } from '@/v2/blocks/scalar-auth-selector-block'
import type { MergedSecuritySchemes } from '@/v2/blocks/scalar-auth-selector-block/helpers/merge-security'
import type { SecuritySchemeObjectSecret } from '@/v2/blocks/scalar-auth-selector-block/helpers/secret-types'
import { getSecuritySchemes } from '@/v2/blocks/operation-block/helpers/build-request-security'
import type { ExtendedScalarCookie } from '@/v2/blocks/request-block/RequestBlock.vue'
import { getActiveEnvironment } from '@/v2/helpers/get-active-environment'
import { getActiveProxyUrl } from '@/v2/helpers/get-active-proxy-url'
import { getServers } from '@/v2/helpers/get-servers'
import type { ClientLayout } from '@/v2/types/layout'
import { combineParams } from '@/v2/features/operation/helpers/combine-params'
import { getSelectedServer } from '@/v2/features/operation/helpers/get-selected-server'
import { getSecurityRequirements } from '@/v2/features/operation/helpers/get-security-requirements'
import { getSelectedSecurity } from '@/v2/features/operation/helpers/get-selected-security'

/** Options override (e.g. modal/config) when computing servers and base URL */
export type GetOperationRequestParamsOptions = Partial<
  Pick<
    ApiReferenceConfigurationRaw,
    'servers' | 'baseServerURL' | 'hideClientButton' | 'authentication' | 'hiddenClients'
  >
>

export type GetOperationRequestParamsInput = {
  workspaceStore: WorkspaceStore | null
  document: OpenApiDocument | null
  path: string | undefined
  method: HttpMethod | undefined
  documentSlug: string
  layout: ClientLayout
  options?: GetOperationRequestParamsOptions
}

/** Result of computing request params for one operation (shared by Operation context and runner). */
export type OperationRequestParams = {
  operation: OperationObject | null
  environment: XScalarEnvironment
  server: ServerObject | null
  servers: ServerObject[]
  serverMeta: ServerMeta
  proxyUrl: string
  globalCookies: ExtendedScalarCookie[]
  securitySchemes: MergedSecuritySchemes
  documentSelectedSecurity: SelectedSecurity | undefined
  operationSelectedSecurity: SelectedSecurity | undefined
  selectedSecuritySchemes: SecuritySchemeObjectSecret[]
  environments: string[]
  activeEnvironment: string | undefined
  authMeta: AuthMeta
}

/**
 * Computes all request params for a single operation from workspace + document + path + method.
 * Shared by useOperationRequestContext (reactive) and runOperationExamplesRunner (per-item).
 */
export function getOperationRequestParams(
  input: GetOperationRequestParamsInput,
): OperationRequestParams {
  const {
    workspaceStore,
    document: doc,
    path: p,
    method: m,
    documentSlug: slug,
    layout: layoutVal,
    options: opts,
  } = input

  const pathItem = p ? getResolvedRef(doc?.paths?.[p]) : null
  let operation: OperationObject | null = null
  if (p && m && doc) {
    const op = getResolvedRef(doc.paths?.[p]?.[m])
    if (op) {
      operation = pathItem
        ? { ...op, parameters: combineParams(pathItem.parameters, op.parameters) }
        : op
    }
  }

  const environment = getActiveEnvironment(workspaceStore, doc)
  const activeEnvironment = workspaceStore?.workspace['x-scalar-active-environment']

  const globalCookies: ExtendedScalarCookie[] = [
    ...((workspaceStore?.workspace?.['x-scalar-cookies'] ?? []).map((it) => ({
      ...it,
      location: 'workspace' as const,
    })) satisfies ExtendedScalarCookie[]),
    ...((doc?.['x-scalar-cookies'] ?? []).map((it) => ({
      ...it,
      location: 'document' as const,
    })) satisfies ExtendedScalarCookie[]),
  ]

  const _servers = opts?.servers ?? operation?.servers ?? doc?.servers
  const servers = getServers(_servers, {
    baseServerUrl: opts?.baseServerURL,
    documentUrl: doc?.['x-scalar-original-source-url'],
  })

  let selectedServerUrl: string | undefined
  if (opts?.servers != null) {
    selectedServerUrl = doc?.['x-scalar-selected-server']
  } else if (operation?.servers != null) {
    selectedServerUrl = operation['x-scalar-selected-server']
  } else {
    selectedServerUrl = doc?.['x-scalar-selected-server']
  }

  const server = getSelectedServer(servers, selectedServerUrl)

  const serverMeta: ServerMeta =
    operation?.servers != null
      ? { type: 'operation', path: p ?? '', method: m ?? 'get' }
      : { type: 'document' }

  const securitySchemes: MergedSecuritySchemes =
    workspaceStore?.auth
      ? mergeSecurity(
          doc?.components?.securitySchemes ?? {},
          {},
          workspaceStore.auth,
          slug,
        )
      : ({} as MergedSecuritySchemes)

  const documentSelectedSecurity = workspaceStore?.auth.getAuthSelectedSchemas({
    type: 'document',
    documentName: slug,
  })

  const operationSelectedSecurity = workspaceStore?.auth.getAuthSelectedSchemas({
    type: 'operation',
    documentName: slug,
    path: p ?? '',
    method: m ?? 'get',
  })

  const securityRequirements = getSecurityRequirements(
    doc?.security ?? [],
    operation?.security,
  )
  const selectedSecurity = getSelectedSecurity(
    documentSelectedSecurity,
    operationSelectedSecurity,
    securityRequirements,
  )
  const selectedSecuritySchemes = getSecuritySchemes(
    securitySchemes,
    selectedSecurity.selectedSchemes,
  )

  const environments = Array.from(
    new Set(
      Object.keys({
        ...doc?.['x-scalar-environments'],
        ...workspaceStore?.workspace['x-scalar-environments'],
      }),
    ),
  )

  const proxyUrl =
    getActiveProxyUrl(
      workspaceStore?.workspace['x-scalar-active-proxy'],
      layoutVal,
    ) ?? ''

  const authMeta: AuthMeta =
    operationSelectedSecurity !== undefined
      ? { type: 'operation', path: p ?? '', method: m ?? 'get' }
      : { type: 'document' }

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
  }
}
