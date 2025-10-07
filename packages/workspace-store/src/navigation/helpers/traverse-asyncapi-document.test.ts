import { describe, expect, it } from 'vitest'

import { traverseAsyncApiDocument } from '@/navigation/helpers/traverse-asyncapi-document'
import type { AsyncApiDocument } from '@/schemas/asyncapi/asyncapi-document'
import type { TraversedAsyncApiOperation, TraversedChannel } from '@/schemas/navigation'

describe('traverseAsyncApiDocument', () => {
  it('should generate navigation for AsyncAPI document with channels and operations', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: '# Test API\n\nThis is a test API.',
      },
      channels: {
        'user/signup': {
          title: 'User Signup',
          description: 'Channel for user signup events',
          operations: {
            'userSignup': 'userSignup',
          },
        },
        'user/login': {
          title: 'User Login',
          description: 'Channel for user login events',
          operations: {
            'userLogin': 'userLogin',
          },
        },
      },
      operations: {
        'userSignup': {
          action: 'publish',
          channel: 'user/signup',
          title: 'Publish User Signup',
          description: 'Publish a user signup event',
        },
        'userLogin': {
          action: 'subscribe',
          channel: 'user/login',
          title: 'Subscribe to User Login',
          description: 'Subscribe to user login events',
        },
      },
    }

    const result = traverseAsyncApiDocument(document)

    expect(result.entries).toHaveLength(3) // description + 2 channels

    // Check description entry
    const descriptionEntry = result.entries[0]
    expect(descriptionEntry?.type).toBe('text')
    expect(descriptionEntry?.title).toBe('Test API')

    // Check channel entries
    const channelEntries = result.entries.slice(1)
    expect(channelEntries).toHaveLength(2)

    // Check first channel (user/login should come first alphabetically)
    const loginChannel = channelEntries[0]
    expect(loginChannel?.type).toBe('channel')
    expect(loginChannel?.title).toBe('User Login')
    expect((loginChannel as TraversedChannel)?.children).toHaveLength(1)

    const loginOperation = (loginChannel as TraversedChannel)?.children![0] as TraversedAsyncApiOperation
    expect(loginOperation.type).toBe('asyncapi-operation')
    expect(loginOperation.action).toBe('subscribe')
    expect(loginOperation.channel).toBe('user/login')

    // Check second channel (user/signup)
    const signupChannel = channelEntries[1]
    expect(signupChannel?.type).toBe('channel')
    expect(signupChannel?.title).toBe('User Signup')
    expect((signupChannel as TraversedChannel)?.children).toHaveLength(1)

    const signupOperation = (signupChannel as TraversedChannel)?.children![0] as TraversedAsyncApiOperation
    expect(signupOperation.type).toBe('asyncapi-operation')
    expect(signupOperation.action).toBe('publish')
    expect(signupOperation.channel).toBe('user/signup')
  })

  it('should handle AsyncAPI document without channels', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: '# Test API\n\nThis is a test API.',
      },
    }

    const result = traverseAsyncApiDocument(document)

    expect(result.entries).toHaveLength(1) // only description
    expect(result.entries[0]?.type).toBe('text')
    expect(result.entries[0]?.title).toBe('Test API')
  })

  it('should handle AsyncAPI document without operations', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      channels: {
        'user/signup': {
          title: 'User Signup',
          description: 'Channel for user signup events',
        },
      },
    }

    const result = traverseAsyncApiDocument(document)

    expect(result.entries).toHaveLength(1) // only channel
    const channelEntry = result.entries[0]
    expect(channelEntry?.type).toBe('channel')
    expect(channelEntry?.title).toBe('User Signup')
    expect((channelEntry as TraversedChannel)?.children).toHaveLength(0)
  })

  it('should sort operations by action (publish first, then subscribe)', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      channels: {
        'test/channel': {
          title: 'Test Channel',
          operations: {
            'subscribeOp': 'subscribeOp',
            'publishOp': 'publishOp',
          },
        },
      },
      operations: {
        'subscribeOp': {
          action: 'subscribe',
          channel: 'test/channel',
          title: 'Subscribe Operation',
        },
        'publishOp': {
          action: 'publish',
          channel: 'test/channel',
          title: 'Publish Operation',
        },
      },
    }

    const result = traverseAsyncApiDocument(document)

    expect(result.entries).toHaveLength(1)
    const channelEntry = result.entries[0]
    expect((channelEntry as TraversedChannel)?.children).toHaveLength(2)

    // First operation should be publish
    const firstOperation = (channelEntry as TraversedChannel)?.children![0] as TraversedAsyncApiOperation
    expect(firstOperation.type).toBe('asyncapi-operation')
    expect(firstOperation.action).toBe('publish')

    // Second operation should be subscribe
    const secondOperation = (channelEntry as TraversedChannel)?.children![1] as TraversedAsyncApiOperation
    expect(secondOperation.type).toBe('asyncapi-operation')
    expect(secondOperation.action).toBe('subscribe')
  })

  it('should handle operations without titles', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      channels: {
        'test/channel': {
          title: 'Test Channel',
          operations: {
            'testOp': 'testOp',
          },
        },
      },
      operations: {
        'testOp': {
          action: 'publish',
          channel: 'test/channel',
          summary: 'Test operation summary',
        },
      },
    }

    const result = traverseAsyncApiDocument(document)

    const channelEntry = result.entries[0]
    const operation = (channelEntry as TraversedChannel)?.children![0] as TraversedAsyncApiOperation
    expect(operation.title).toBe('Test operation summary')
  })

  it('should handle operations without titles or summaries', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      channels: {
        'test/channel': {
          title: 'Test Channel',
          operations: {
            'testOp': 'testOp',
          },
        },
      },
      operations: {
        'testOp': {
          action: 'publish',
          channel: 'test/channel',
        },
      },
    }

    const result = traverseAsyncApiDocument(document)

    const channelEntry = result.entries[0]
    const operation = (channelEntry as TraversedChannel)?.children![0] as TraversedAsyncApiOperation
    expect(operation.title).toBe('publish test/channel')
  })

  it('should handle channels without titles', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      channels: {
        'test/channel': {
          summary: 'Test channel summary',
        },
      },
    }

    const result = traverseAsyncApiDocument(document)

    const channelEntry = result.entries[0]
    expect(channelEntry?.title).toBe('Test channel summary')
  })

  it('should handle channels without titles or summaries', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      channels: {
        'test/channel': {},
      },
    }

    const result = traverseAsyncApiDocument(document)

    const channelEntry = result.entries[0]
    expect(channelEntry?.title).toBe('test/channel')
  })
})
