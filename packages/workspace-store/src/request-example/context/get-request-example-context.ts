import type { AuthenticationConfiguration } from '@scalar/types/api-reference'

import type { WorkspaceStore } from '@/client'
import type { SelectedSecurity } from '@/entities/auth'
import type { AuthMeta, ServerMeta } from '@/events'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { SecuritySchemeObjectSecret } from '@/request-example/builder/security/secret-types'
import { getActiveEnvironment } from '@/request-example/context/environment'
import { getDefaultHeaders } from '@/request-example/context/headers'
import { combineParams } from '@/request-example/context/helpers/combine-params'
import { type Layout, getActiveProxyUrl } from '@/request-example/context/proxy'
import { getSecurityRequirements } from '@/request-example/context/security/get-security-requirements'
import { getSecuritySchemes } from '@/request-example/context/security/get-security-schemes'
import { getSelectedSecurity } from '@/request-example/context/security/get-selected-security'
import { type MergedSecuritySchemes, mergeSecurity } from '@/request-example/context/security/merge-security'
import { getSelectedServer, getServers } from '@/request-example/context/servers'
import type { RequestExampleMeta, Result } from '@/request-example/types'
import type { XScalarEnvironment } from '@/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@/schemas/extensions/general/x-scalar-cookies'
import type { OperationObject } from '@/schemas/v3.1/strict/operation'
import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'
import type { ServerObject } from '@/schemas/v3.1/strict/server'
import type { WorkspaceDocument } from '@/schemas/workspace'

export type BuildRequestExampleContext = {
  operation: OperationObject
  environment: {
    name: string | null
    environment: XScalarEnvironment
  }
  cookies: {
    workspace: XScalarCookie[]
    document: XScalarCookie[]
  }
  servers: {
    list: ServerObject[]
    selected: ServerObject | null
    meta: ServerMeta
  }
  proxy: {
    url: string | null
  }
  headers: {
    default: Record<string, string>
  }
  security: {
    schemes: MergedSecuritySchemes
    requirements: SecurityRequirementObject[]
    selected: SelectedSecurity
    selectedSchemes: SecuritySchemeObjectSecret[]
    meta: AuthMeta
  }
}

export const getRequestExampleContext = (
  workspaceStore: WorkspaceStore,
  documentName: string,
  requestExampleMeta: RequestExampleMeta,
  options: Partial<{
    servers: ServerObject[]
    baseServerUrl: string
    layout: Layout
    appVersion: string
    isElectron: boolean
    /** User facing authentication configuration */
    authentication: AuthenticationConfiguration
    /**
     * When the document is not in `workspace.documents[documentName]` yet, use this copy (same shape as the
     * workspace entry). Callers that already hold the resolved document should pass it so behavior matches
     * reading from props.
     */
    fallbackDocument: WorkspaceDocument | null
  }> = {},
): Result<BuildRequestExampleContext> => {
  const { path, method, exampleName } = requestExampleMeta
  const document = workspaceStore.workspace.documents[documentName] ?? options.fallbackDocument ?? undefined
  if (!document) {
    return {
      ok: false,
      error: `Document ${documentName} not found`,
    }
  }

  const pathItem = getResolvedRef(document.paths?.[path])
  if (!pathItem) {
    return {
      ok: false,
      error: `Path ${path} not found`,
    }
  }

  const resolvedOperation = getResolvedRef(pathItem[method])
  if (!resolvedOperation) {
    return {
      ok: false,
      error: `Method ${method} not found on path ${path}`,
    }
  }

  // Combine the path item and operation parameters
  const operation = {
    ...resolvedOperation,
    parameters: combineParams(pathItem.parameters, resolvedOperation.parameters ?? []),
  }

  //------------------------------------------------------------------------------------------------
  //                                 ENVIRONMENT CONTEXT
  //------------------------------------------------------------------------------------------------
  // Get environment context for the request example
  const environment = getActiveEnvironment(workspaceStore, document)

  //------------------------------------------------------------------------------------------------
  //                                 SERVER CONTEXT
  //------------------------------------------------------------------------------------------------
  // Get server context for the request example
  const serverList = getServers(options.servers ?? operation.servers ?? document.servers, {
    baseServerUrl: options.baseServerUrl,
    documentUrl: document['x-scalar-original-source-url'],
  })
  const selectedServer = getSelectedServer(document, operation, options.servers ?? null, serverList)

  //------------------------------------------------------------------------------------------------
  //                                 SECURITY CONTEXT
  //------------------------------------------------------------------------------------------------
  const documentSelectedSecurity = workspaceStore.auth.getAuthSelectedSchemas({
    type: 'document',
    documentName,
  })

  const operationSelectedSecurity = workspaceStore.auth.getAuthSelectedSchemas({
    type: 'operation',
    documentName,
    path: path ?? '',
    method: method ?? 'get',
  })

  const securitySchemes = mergeSecurity(
    document.components?.securitySchemes ?? {},
    options.authentication?.securitySchemes ?? {},
    workspaceStore.auth,
    documentName,
  )

  const securityRequirements = getSecurityRequirements(document.security, operation.security)
  const selectedSecurity = getSelectedSecurity(
    documentSelectedSecurity,
    operationSelectedSecurity,
    securityRequirements,
    securitySchemes,
    options.authentication?.preferredSecurityScheme,
  )

  /** The above selected requirements in scheme form */
  const selectedSecuritySchemes = getSecuritySchemes(securitySchemes, selectedSecurity.selectedSchemes)

  const serverMeta: ServerMeta =
    operation.servers != null ? { type: 'operation', path: path ?? '', method: method ?? 'get' } : { type: 'document' }

  const authMeta: AuthMeta =
    operationSelectedSecurity !== undefined
      ? { type: 'operation', path: path ?? '', method: method ?? 'get' }
      : { type: 'document' }

  //------------------------------------------------------------------------------------------------
  //                                 PROXY URL
  //------------------------------------------------------------------------------------------------
  // Get proxy url for the request example
  const proxyUrl = getActiveProxyUrl(workspaceStore.workspace['x-scalar-active-proxy'], options.layout ?? 'other')

  const defaultHeaders = getDefaultHeaders({
    method,
    operation,
    exampleName,
    options: { appVersion: options.appVersion ?? '0.0.0', isElectron: options.isElectron ?? false },
  })

  return {
    ok: true,
    data: {
      operation,
      environment,
      cookies: {
        workspace: workspaceStore.workspace['x-scalar-cookies'] ?? [],
        document: document['x-scalar-cookies'] ?? [],
      },
      headers: {
        default: defaultHeaders,
      },
      servers: {
        list: serverList,
        selected: selectedServer,
        meta: serverMeta,
      },
      proxy: {
        url: proxyUrl,
      },
      security: {
        schemes: securitySchemes,
        requirements: securityRequirements,
        selected: selectedSecurity,
        selectedSchemes: selectedSecuritySchemes,
        meta: authMeta,
      },
    },
  }
}
