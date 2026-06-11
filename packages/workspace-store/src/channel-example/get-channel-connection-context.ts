import type { AuthenticationConfiguration } from '@scalar/types/api-reference'

import { buildConnectionUrl } from '@/channel-example/build-connection-url'
import { getSendChannelMessages } from '@/channel-example/get-all-channel-messages'
import { getChannelConnectionSecurityRequirements } from '@/channel-example/get-channel-connection-security'
import { getChannelOperations } from '@/channel-example/get-channel-operations'
import { getChannelParameters } from '@/channel-example/get-channel-parameters'
import { resolveChannel } from '@/channel-example/resolve-channel'
import { getAsyncApiServers, getSelectedAsyncApiServer } from '@/channel-example/servers'
import type { BuildChannelConnectionContext, ChannelConnectionMeta } from '@/channel-example/types'
import type { WorkspaceStore } from '@/client'
import type { AuthMeta } from '@/events'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { getEnvironmentVariables } from '@/request-example/builder/helpers/get-environment-variables'
import { getActiveEnvironment } from '@/request-example/context/environment'
import { getSecuritySchemes } from '@/request-example/context/security/get-security-schemes'
import { getSelectedSecurity } from '@/request-example/context/security/get-selected-security'
import { mergeSecurity } from '@/request-example/context/security/merge-security'
import type { Result } from '@/request-example/types'
import { isAsyncApiDocument } from '@/schemas/type-guards'
import type { ComponentsObject } from '@/schemas/v3.1/strict/openapi-document'
import type { WorkspaceDocument } from '@/schemas/workspace'

/** Uses channel name as the auth path key for AsyncAPI channel connections. */
const ASYNCAPI_CHANNEL_AUTH_METHOD = 'get' as const

/**
 * Builds context for testing a WebSocket channel (Postman-style): one connection per channel,
 * with AsyncAPI messages, servers, and parameters as the data store.
 */
export const getChannelConnectionContext = (
  workspaceStore: WorkspaceStore,
  documentName: string,
  channelConnectionMeta: ChannelConnectionMeta,
  options: Partial<{
    pathParameters: Record<string, string>
    queryParameters: Record<string, string>
    authentication: AuthenticationConfiguration
    fallbackDocument: WorkspaceDocument | null
  }> = {},
): Result<BuildChannelConnectionContext> => {
  const { channelName } = channelConnectionMeta
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

  const resolvedChannel = resolveChannel(document, channelName)
  if (!resolvedChannel) {
    return {
      ok: false,
      error: `Channel ${channelName} not found`,
    }
  }

  const { channel, channelAddress } = resolvedChannel
  const environment = getActiveEnvironment(workspaceStore, document)
  const environmentVariables = getEnvironmentVariables(environment.environment)
  const channelOperations = getChannelOperations(document, channelName)
  const parameters = getChannelParameters(channel, null, {
    path: options.pathParameters,
    query: options.queryParameters,
  })

  const servers = getAsyncApiServers(document, {
    channel,
    operation: null,
    pathParameters: parameters.path,
    queryParameters: parameters.query,
    environmentVariables,
  })
  const selectedServer = getSelectedAsyncApiServer(document, servers, null)

  const serverForUrl = selectedServer?.server ?? servers[0]?.server
  if (!serverForUrl) {
    return {
      ok: false,
      error: `No WebSocket servers available for channel ${channelName}`,
    }
  }

  const connectionUrl =
    selectedServer?.connectionUrl ??
    buildConnectionUrl({
      server: serverForUrl,
      channel,
      operation: null,
      pathParameters: parameters.path,
      queryParameters: parameters.query,
      environmentVariables,
    })

  const messages = getSendChannelMessages(document, channelName, channel, channelOperations)
  const selectedMessage = messages[0] ?? null

  const documentSelectedSecurity = workspaceStore.auth.getAuthSelectedSchemas({
    type: 'document',
    documentName,
  })

  const channelSelectedSecurity = workspaceStore.auth.getAuthSelectedSchemas({
    type: 'operation',
    documentName,
    path: channelName,
    method: ASYNCAPI_CHANNEL_AUTH_METHOD,
  })

  const components = document.components ? getResolvedRef(document.components) : undefined

  const securitySchemes = mergeSecurity(
    (components?.securitySchemes ?? {}) as ComponentsObject['securitySchemes'],
    options.authentication?.securitySchemes ?? {},
    workspaceStore.auth,
    documentName,
  )

  const securityRequirements = getChannelConnectionSecurityRequirements(
    document,
    channel,
    selectedServer?.server ?? null,
    channelOperations,
  )

  const selectedSecurity = getSelectedSecurity(
    documentSelectedSecurity,
    channelSelectedSecurity,
    securityRequirements,
    securitySchemes,
    options.authentication?.preferredSecurityScheme,
  )

  const selectedSecuritySchemes = getSecuritySchemes(
    securitySchemes,
    selectedSecurity.selectedSchemes[selectedSecurity.selectedIndex] ?? {},
  )

  const authMeta: AuthMeta = channelSelectedSecurity
    ? { type: 'operation', path: channelName, method: ASYNCAPI_CHANNEL_AUTH_METHOD }
    : { type: 'document' }

  return {
    ok: true,
    data: {
      channel,
      channelName,
      channelAddress,
      operations: channelOperations,
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
