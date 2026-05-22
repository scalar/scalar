import type { AsyncApiChannelObject, AsyncApiDocument, AsyncApiServerObject } from '@scalar/types/asyncapi/3.1'

import { getAsyncApiSecurityRequirements } from '@/channel-example/get-asyncapi-security-requirements'
import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'

import type { ChannelOperationSummary } from './get-channel-operations'

const dedupeRequirements = (requirements: SecurityRequirementObject[]): SecurityRequirementObject[] => {
  const seen = new Set<string>()

  return requirements.filter((requirement) => {
    const key = JSON.stringify(requirement)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/**
 * Merges security requirements from the selected server and all operations on a channel.
 */
export const getChannelConnectionSecurityRequirements = (
  document: AsyncApiDocument,
  _channel: AsyncApiChannelObject,
  server: AsyncApiServerObject | null,
  channelOperations: ChannelOperationSummary[],
): SecurityRequirementObject[] => {
  const serverRequirements = getAsyncApiSecurityRequirements(document, null, server)

  const operationRequirements = channelOperations.flatMap(({ operation }) =>
    getAsyncApiSecurityRequirements(document, operation, null),
  )

  return dedupeRequirements([...serverRequirements, ...operationRequirements])
}
