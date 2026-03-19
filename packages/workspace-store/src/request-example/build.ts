import type { HttpMethod } from '@scalar/helpers/http/http-methods'

import type { WorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
// import { type ExtendedScalarCookie, getGlobalCookies } from '@/request-example/cookies'
import { getActiveEnvironment } from '@/request-example/environment'
import { getSelectedServer, getServers } from '@/request-example/servers'
import type { XScalarEnvironment } from '@/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@/schemas/extensions/general/x-scalar-cookies'
import type { OperationObject } from '@/schemas/v3.1/strict/operation'
import type { ServerObject } from '@/schemas/v3.1/strict/server'

export type RequestExampleMeta = {
  path: string
  method: HttpMethod
  exampleName: string
}

type Result<T> =
  | {
      ok: true
      data: T
    }
  | {
      ok: false
      error: string
    }

type BuildRequestExampleContext = {
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
  }
}

export const buildRequestExample = (
  workspaceStore: WorkspaceStore,
  documentName: string,
  requestExampleMeta: RequestExampleMeta,
  options: Partial<{
    servers: ServerObject[]
    baseServerUrl: string
  }> = {},
): Result<BuildRequestExampleContext> => {
  const { path, method, exampleName: _ } = requestExampleMeta
  const document = workspaceStore.workspace.documents[documentName]
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
  const operation = getResolvedRef(pathItem[method])
  if (!operation) {
    return {
      ok: false,
      error: `Method ${method} not found on path ${path}`,
    }
  }

  //------------------------------------------------------------------------------------------------
  //                                 ENVIRONMENT CONTEXT
  //------------------------------------------------------------------------------------------------
  // Get environment context for the request example
  const environment = getActiveEnvironment(workspaceStore, document)

  //------------------------------------------------------------------------------------------------
  //                                 COOKIES CONTEXT
  //------------------------------------------------------------------------------------------------
  // TODO: Think about this again based on the context

  //------------------------------------------------------------------------------------------------
  //                                 SERVER CONTEXT
  //------------------------------------------------------------------------------------------------
  // Get server context for the request example
  const serverList = getServers(options.servers ?? operation.servers ?? document.servers, {
    baseServerUrl: options.baseServerUrl,
    documentUrl: document['x-scalar-original-source-url'],
  })
  const selectedServer = getSelectedServer(document, operation, options.servers ?? null, serverList)
  // const activeServer =

  //------------------------------------------------------------------------------------------------
  //                                 SECURITY CONTEXT
  //------------------------------------------------------------------------------------------------
  // Get security schemes for the request example
  // const securitySchemes = getSecuritySchemes(securitySchemes, selectedSecuritySchemes)

  // Get selected security schemes for the request example
  // const selectedSecuritySchemes = getSelectedSecuritySchemes(securitySchemes, selectedSecuritySchemes)

  // Get selected security for the request example
  // const selectedSecurity = getSelectedSecurity(selectedSecuritySchemes, selectedSecuritySchemes)

  // Get selected security requirements for the request example
  // const selectedSecurityRequirements = getSelectedSecurityRequirements(selectedSecuritySchemes, selectedSecuritySchemes)

  //------------------------------------------------------------------------------------------------
  //                                 PROXY URL
  //------------------------------------------------------------------------------------------------
  // Get proxy url for the request example
  // const proxyUrl = getProxyUrl(workspaceStore, document)

  return {
    ok: true,
    data: {
      operation,
      environment,
      cookies: {
        workspace: workspaceStore.workspace['x-scalar-cookies'] ?? [],
        document: document['x-scalar-cookies'] ?? [],
      },
      servers: {
        list: serverList,
        selected: selectedServer,
      },
    },
  }
}
