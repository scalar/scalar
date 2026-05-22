import type { AuthenticationConfiguration } from '@scalar/types/api-reference'

import { buildConnectionUrl } from '@/channel-example/build-connection-url'
import { getAsyncApiSecurityRequirements } from '@/channel-example/get-asyncapi-security-requirements'
import { getChannelMessages } from '@/channel-example/get-channel-messages'
import { getChannelParameters } from '@/channel-example/get-channel-parameters'
import { resolveOperationChannel } from '@/channel-example/resolve-operation-channel'
import { resolveOperationWithTraits } from '@/channel-example/resolve-operation-with-traits'
import { getAsyncApiServers, getSelectedAsyncApiServer } from '@/channel-example/servers'
import type { BuildChannelExampleContext, ChannelExampleMeta } from '@/channel-example/types'
import type { WorkspaceStore } from '@/client'
import type { AuthMeta } from '@/events'
import { getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'
import { getEnvironmentVariables } from '@/request-example/builder/helpers/get-environment-variables'
import { getActiveEnvironment } from '@/request-example/context/environment'
import { getSecuritySchemes } from '@/request-example/context/security/get-security-schemes'
import { getSelectedSecurity } from '@/request-example/context/security/get-selected-security'
import { mergeSecurity } from '@/request-example/context/security/merge-security'
import type { Result } from '@/request-example/types'
import { isAsyncApiDocument } from '@/schemas/type-guards'
import type { ComponentsObject } from '@/schemas/v3.1/strict/openapi-document'
import type { WorkspaceDocument } from '@/schemas/workspace'

/** Uses operation name as the auth path key for AsyncAPI channel operations. */
const ASYNCAPI_AUTH_METHOD = 'get' as const

export const getChannelExampleContext = (
  workspaceStore: WorkspaceStore,
  documentName: string,
  channelExampleMeta: ChannelExampleMeta,
  options: Partial<{
    pathParameters: Record<string, string>
    queryParameters: Record<string, string>
    /** User facing authentication configuration */
    authentication: AuthenticationConfiguration
    /**
     * When the document is not in `workspace.documents[documentName]` yet, use this copy (same shape as the
     * workspace entry). Callers that already hold the resolved document should pass it so behavior matches
     * reading from props.
     */
    fallbackDocument: WorkspaceDocument | null
  }> = {},
): Result<BuildChannelExampleContext> => {
  const { operationName } = channelExampleMeta
  const document = workspaceStore.workspace.documents[documentName] ?? options.fallbackDocument ?? undefined

  if (!document) {
    return {
      ok: false,
      error: `Document ${documentName} not found`,
    }
  }

  if (!isAsyncApiDocument(document)) {
    return {
      ok: false,
      error: `Document ${documentName} is not an AsyncAPI document`,
    }
  }

  const operationRef = document.operations?.[operationName]
  if (!operationRef) {
    return {
      ok: false,
      error: `Operation ${operationName} not found`,
    }
  }

  const operation = resolveOperationWithTraits(getResolvedRef(operationRef))
  const resolvedChannel = resolveOperationChannel(document, operation)

  if (!resolvedChannel) {
    return {
      ok: false,
      error: `Channel for operation ${operationName} could not be resolved`,
    }
  }

  const { channelName, channel, channelAddress } = resolvedChannel
  const environment = getActiveEnvironment(workspaceStore, document)
  const environmentVariables = getEnvironmentVariables(environment.environment)
  const parameters = getChannelParameters(channel, operation, {
    path: options.pathParameters,
    query: options.queryParameters,
  })

  const servers = getAsyncApiServers(document, {
    channel,
    operation,
    pathParameters: parameters.path,
    queryParameters: parameters.query,
    environmentVariables,
  })
  const selectedServer = getSelectedAsyncApiServer(document, servers, operation)

  const serverForUrl = selectedServer?.server ?? servers[0]?.server
  if (!serverForUrl) {
    return {
      ok: false,
      error: `No WebSocket servers available for operation ${operationName}`,
    }
  }

  const connectionUrl =
    selectedServer?.connectionUrl ??
    buildConnectionUrl({
      server: serverForUrl,
      channel,
      operation,
      pathParameters: parameters.path,
      queryParameters: parameters.query,
      environmentVariables,
    })

  const messages = getChannelMessages(document, channel, operation)
  const selectedMessage = messages[0] ?? null

  const documentSelectedSecurity = workspaceStore.auth.getAuthSelectedSchemas({
    type: 'document',
    documentName,
  })

  const operationSelectedSecurity = workspaceStore.auth.getAuthSelectedSchemas({
    type: 'operation',
    documentName,
    path: operationName,
    method: ASYNCAPI_AUTH_METHOD,
  })

  const components = document.components ? getResolvedRef(document.components, mergeSiblingReferences) : undefined

  const securitySchemes = mergeSecurity(
    (components?.securitySchemes ?? {}) as ComponentsObject['securitySchemes'],
    options.authentication?.securitySchemes ?? {},
    workspaceStore.auth,
    documentName,
  )

  const securityRequirements = getAsyncApiSecurityRequirements(document, operation, selectedServer?.server ?? null)

  const selectedSecurity = getSelectedSecurity(
    documentSelectedSecurity,
    operationSelectedSecurity,
    securityRequirements,
    securitySchemes,
    options.authentication?.preferredSecurityScheme,
  )

  const selectedSecuritySchemes = getSecuritySchemes(
    securitySchemes,
    selectedSecurity.selectedSchemes[selectedSecurity.selectedIndex] ?? {},
  )

  const authMeta: AuthMeta = operationSelectedSecurity
    ? { type: 'operation', path: operationName, method: ASYNCAPI_AUTH_METHOD }
    : { type: 'document' }

  return {
    ok: true,
    data: {
      operation,
      channel,
      channelName,
      channelAddress,
      messages,
      selectedMessage,
      servers: {
        list: servers,
        selected: selectedServer,
      },
      connectionUrl,
      parameters,
      security: {
        schemes: securitySchemes,
        requirements: securityRequirements,
        selected: selectedSecurity,
        selectedSchemes: selectedSecuritySchemes,
        meta: authMeta,
      },
      environment,
    },
  }
}
