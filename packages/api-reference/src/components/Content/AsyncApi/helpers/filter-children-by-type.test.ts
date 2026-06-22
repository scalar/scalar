import type {
  TraversedAsyncApiMessage,
  TraversedAsyncApiOperation,
  TraversedEntry,
} from '@scalar/workspace-store/schemas/navigation'
import { describe, expect, it } from 'vitest'

import { filterChildrenByType } from './filter-children-by-type'

const operation = {
  id: 'op-1',
  title: 'Send',
  type: 'asyncapi-operation',
  operationName: 'sendUserSignedUp',
  action: 'send',
  channelName: 'userSignedup',
  channelAddress: 'user/signedup',
} as TraversedAsyncApiOperation

const message = {
  id: 'msg-1',
  title: 'User',
  type: 'asyncapi-message',
  messageName: 'UserMessage',
  channelName: 'userSignedup',
} as TraversedAsyncApiMessage

describe('filterChildrenByType', () => {
  it('keeps only the children matching the requested type', () => {
    const children: TraversedEntry[] = [operation, message]

    expect(filterChildrenByType<TraversedAsyncApiMessage>(children, 'asyncapi-message')).toEqual([message])
  })

  it('returns an empty array when children is undefined', () => {
    expect(filterChildrenByType<TraversedAsyncApiOperation>(undefined, 'asyncapi-operation')).toEqual([])
  })
})
