import type { AsyncApiChannelObject, AsyncApiDocument, AsyncApiServerObject } from '@scalar/types/asyncapi/3.1'

import { getAsyncApiSecurityRequirements } from '@/channel-example/get-asyncapi-security-requirements'
import type { SecurityRequirementObject } from '@/schemas/v3.2/strict/security-requirement'

import type { ChannelOperationSummary } from './get-channel-operations'

/**
 * Connection authentication belongs to the selected server; operation security is documented separately.
 * Keep the channel arguments for compatibility with existing consumers of this public helper.
 */
export const getChannelConnectionSecurityRequirements = (
  document: AsyncApiDocument,
  _channel: AsyncApiChannelObject,
  server: AsyncApiServerObject | null,
  _channelOperations: ChannelOperationSummary[],
  serverName?: string,
): SecurityRequirementObject[] => {
  return getAsyncApiSecurityRequirements(document, null, server, { serverName })
}
