import { describe, expect, it } from 'vitest'

import { traverseAsyncApiDocument } from '@/navigation/helpers/traverse-asyncapi-document'
import type { AsyncApiDocument } from '@/schemas/asyncapi/v3.0/asyncapi-document'
import type {
  TraversedAsyncApiOperation,
  TraversedChannel,
  TraversedDescription,
  TraversedMessage,
} from '@/schemas/navigation'

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
        },
        'user/login': {
          title: 'User Login',
          description: 'Channel for user login events',
        },
      },
      operations: {
        'userSignup': {
          action: 'send',
          channel: 'user/signup',
          title: 'Publish User Signup',
          description: 'Publish a user signup event',
        },
        'userLogin': {
          action: 'receive',
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
    expect(loginOperation.action).toBe('receive')
    expect(loginOperation.channel).toBe('user/login')

    // Check second channel (user/signup)
    const signupChannel = channelEntries[1]
    expect(signupChannel?.type).toBe('channel')
    expect(signupChannel?.title).toBe('User Signup')
    expect((signupChannel as TraversedChannel)?.children).toHaveLength(1)

    const signupOperation = (signupChannel as TraversedChannel)?.children![0] as TraversedAsyncApiOperation
    expect(signupOperation.type).toBe('asyncapi-operation')
    expect(signupOperation.action).toBe('send')
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
        },
      },
      operations: {
        'subscribeOp': {
          action: 'receive',
          channel: 'test/channel',
          title: 'Subscribe Operation',
        },
        'publishOp': {
          action: 'send',
          channel: 'test/channel',
          title: 'Publish Operation',
        },
      },
    }

    const result = traverseAsyncApiDocument(document)

    expect(result.entries).toHaveLength(1)
    const channelEntry = result.entries[0]
    expect((channelEntry as TraversedChannel)?.children).toHaveLength(2)

    // First operation should be send
    const firstOperation = (channelEntry as TraversedChannel)?.children![0] as TraversedAsyncApiOperation
    expect(firstOperation.type).toBe('asyncapi-operation')
    expect(firstOperation.action).toBe('send')

    // Second operation should be receive
    const secondOperation = (channelEntry as TraversedChannel)?.children![1] as TraversedAsyncApiOperation
    expect(secondOperation.type).toBe('asyncapi-operation')
    expect(secondOperation.action).toBe('receive')
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
        },
      },
      operations: {
        'testOp': {
          action: 'send',
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
        },
      },
      operations: {
        'testOp': {
          action: 'send',
          channel: 'test/channel',
        },
      },
    }

    const result = traverseAsyncApiDocument(document)

    const channelEntry = result.entries[0]
    const operation = (channelEntry as TraversedChannel)?.children![0] as TraversedAsyncApiOperation
    expect(operation.title).toBe('send test/channel')
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

  it('generates navigation with messages under channels', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      channels: {
        'user/events': {
          title: 'User Events',
          messages: {
            'userCreated': {
              name: 'UserCreated',
              title: 'User Created Event',
              summary: 'A new user has been created',
            },
            'userUpdated': {
              name: 'UserUpdated',
              title: 'User Updated Event',
              summary: 'A user has been updated',
            },
          },
        },
      },
    }

    const result = traverseAsyncApiDocument(document)

    expect(result.entries).toHaveLength(1)
    const channelEntry = result.entries[0] as TraversedChannel
    expect(channelEntry.type).toBe('channel')
    expect(channelEntry.title).toBe('User Events')
    expect(channelEntry.children).toHaveLength(1)

    // Check Messages group
    const messagesGroup = channelEntry.children![0] as TraversedDescription
    expect(messagesGroup.type).toBe('text')
    expect(messagesGroup.title).toBe('Messages')
    expect(messagesGroup.children).toHaveLength(2)

    // Check message entries
    const userCreatedMessage = messagesGroup.children![0] as TraversedMessage
    expect(userCreatedMessage.type).toBe('asyncapi-message')
    expect(userCreatedMessage.title).toBe('User Created Event')
    expect(userCreatedMessage.name).toBe('userCreated')
    expect(userCreatedMessage.channel).toBe('user/events')
    expect(userCreatedMessage.ref).toBe('#/components/messages/UserCreated')

    const userUpdatedMessage = messagesGroup.children![1] as TraversedMessage
    expect(userUpdatedMessage.type).toBe('asyncapi-message')
    expect(userUpdatedMessage.title).toBe('User Updated Event')
    expect(userUpdatedMessage.name).toBe('userUpdated')
    expect(userUpdatedMessage.channel).toBe('user/events')
    expect(userUpdatedMessage.ref).toBe('#/components/messages/UserUpdated')
  })

  it('generates navigation with both operations and messages under channels', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      channels: {
        'user/events': {
          title: 'User Events',
          messages: {
            'userCreated': {
              name: 'UserCreated',
              title: 'User Created Event',
            },
          },
        },
      },
      operations: {
        'subscribeUserEvents': {
          action: 'receive',
          channel: 'user/events',
          title: 'Subscribe to User Events',
        },
      },
    }

    const result = traverseAsyncApiDocument(document)

    const channelEntry = result.entries[0] as TraversedChannel
    expect(channelEntry.children).toHaveLength(2)

    // First should be operation
    const operation = channelEntry.children![0] as TraversedAsyncApiOperation
    expect(operation.type).toBe('asyncapi-operation')
    expect(operation.action).toBe('receive')
    expect(operation.title).toBe('Subscribe to User Events')

    // Second should be Messages group
    const messagesGroup = channelEntry.children![1] as TraversedDescription
    expect(messagesGroup.type).toBe('text')
    expect(messagesGroup.title).toBe('Messages')
    expect(messagesGroup.children).toHaveLength(1)

    const message = messagesGroup.children![0] as TraversedMessage
    expect(message.type).toBe('asyncapi-message')
    expect(message.title).toBe('User Created Event')
  })

  it('handles channels without messages', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      channels: {
        'user/events': {
          title: 'User Events',
        },
      },
      operations: {
        'subscribeUserEvents': {
          action: 'receive',
          channel: 'user/events',
          title: 'Subscribe to User Events',
        },
      },
    }

    const result = traverseAsyncApiDocument(document)

    const channelEntry = result.entries[0] as TraversedChannel
    expect(channelEntry.children).toHaveLength(1) // Only operation, no Messages group

    const operation = channelEntry.children![0] as TraversedAsyncApiOperation
    expect(operation.type).toBe('asyncapi-operation')
  })

  it('generates navigation with models section', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      channels: {
        'user/events': {
          title: 'User Events',
        },
      },
      components: {
        schemas: {
          'User': {
            title: 'User',
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
          'UserEvent': {
            title: 'User Event',
            type: 'object',
            properties: {
              userId: { type: 'string' },
              eventType: { type: 'string' },
            },
          },
        },
      },
    }

    const config = {
      'x-scalar-reference-config': {
        features: {
          showModels: true,
        },
      },
    }

    const result = traverseAsyncApiDocument(document, config)

    expect(result.entries).toHaveLength(2) // channel + models

    // Check models section
    const modelsSection = result.entries[1] as TraversedDescription
    expect(modelsSection.type).toBe('text')
    expect(modelsSection.title).toBe('Models')
    expect(modelsSection.children).toHaveLength(2)

    // Check model entries
    const userModel = modelsSection.children![0]
    expect(userModel?.type).toBe('model')
    expect(userModel?.title).toBe('User')

    const userEventModel = modelsSection.children![1]
    expect(userEventModel?.type).toBe('model')
    expect(userEventModel?.title).toBe('User Event')
  })

  it('hides models section when showModels is false', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      channels: {
        'user/events': {
          title: 'User Events',
        },
      },
      components: {
        schemas: {
          'User': {
            title: 'User',
            type: 'object',
          },
        },
      },
    }

    const config = {
      'x-scalar-reference-config': {
        features: {
          showModels: false,
        },
      },
    }

    const result = traverseAsyncApiDocument(document, config)

    expect(result.entries).toHaveLength(1) // Only channel, no models
    expect(result.entries[0]?.type).toBe('channel')
  })

  it('handles messages without titles or summaries', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      channels: {
        'user/events': {
          title: 'User Events',
          messages: {
            'userCreated': {
              name: 'UserCreated',
            },
          },
        },
      },
    }

    const result = traverseAsyncApiDocument(document)

    const channelEntry = result.entries[0] as TraversedChannel
    const messagesGroup = channelEntry.children![0] as TraversedDescription
    const message = messagesGroup.children![0] as TraversedMessage

    expect(message.title).toBe('UserCreated') // Uses the name property from the message
  })

  it('generates proper message IDs', () => {
    const document: AsyncApiDocument = {
      asyncapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      channels: {
        'user/events': {
          title: 'User Events',
          messages: {
            'userCreated': {
              name: 'UserCreated',
              title: 'User Created Event',
            },
          },
        },
      },
    }

    const result = traverseAsyncApiDocument(document)

    const channelEntry = result.entries[0] as TraversedChannel
    const messagesGroup = channelEntry.children![0] as TraversedDescription
    const message = messagesGroup.children![0] as TraversedMessage

    expect(message.id).toBe('message/userevents/usercreated')
  })
})
