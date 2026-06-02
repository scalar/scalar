import type { AsyncApiDocument, AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'

import { getResolvedRef } from '@/helpers/get-resolved-ref'

import { resolveOperationChannel } from './resolve-operation-channel'
import { resolveOperationWithTraits } from './resolve-operation-with-traits'

export type ChannelOperationSummary = {
  operationName: string
  operation: AsyncApiOperationObject
  action: 'send' | 'receive'
}

/**
 * Lists AsyncAPI operations that target a given channel (for reference in the channel connection UI).
 */
export const getChannelOperations = (document: AsyncApiDocument, channelName: string): ChannelOperationSummary[] => {
  const operations = document.operations ?? {}

  return Object.entries(operations)
    .map(([operationName, operationRef]) => {
      const operation = resolveOperationWithTraits(getResolvedRef(operationRef))
      const resolved = resolveOperationChannel(document, operation)
      if (resolved?.channelName !== channelName) {
        return undefined
      }

      const action = operation.action === 'send' ? 'send' : 'receive'

      return { operationName, operation, action }
    })
    .filter((entry): entry is ChannelOperationSummary => entry != null)
}
