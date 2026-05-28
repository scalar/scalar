import { describe, expect, it } from 'vitest'

import { upgradeFromTwoToThree } from './upgrade-from-two-to-three'

describe('upgradeFromTwoToThree', () => {
  it('bumps an AsyncAPI 2.x document to 3.0.0', () => {
    const document = upgradeFromTwoToThree({ asyncapi: '2.6.0', info: {} })

    expect(document.asyncapi).toBe('3.0.0')
  })

  it('leaves non-2.x documents untouched', () => {
    const document = { asyncapi: '1.2.0', info: {} }

    expect(upgradeFromTwoToThree(document)).toBe(document)
  })

  // Servers ------------------------------------------------------------------

  it('splits server url into host and pathname when a path is present', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      servers: {
        production: { url: 'broker.example.com:1883/v2', protocol: 'mqtt' },
      },
    })

    expect(document.servers).toEqual({
      production: { host: 'broker.example.com:1883', pathname: '/v2', protocol: 'mqtt' },
    })
  })

  it('uses host only when the server url has no path', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      servers: {
        production: { url: 'broker.example.com:1883', protocol: 'mqtt' },
      },
    })

    expect(document.servers).toEqual({
      production: { host: 'broker.example.com:1883', protocol: 'mqtt' },
    })
  })

  it('keeps the scheme on host when splitting a fully-qualified url', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      servers: {
        production: { url: 'https://api.example.com/v2', protocol: 'http' },
      },
    })

    expect(document.servers).toEqual({
      production: { host: 'https://api.example.com', pathname: '/v2', protocol: 'http' },
    })
  })

  it('converts non-OAuth server security to $ref entries', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      servers: {
        production: {
          url: 'broker.example.com',
          protocol: 'mqtt',
          security: [{ apiKey: [] }],
        },
      },
      components: {
        securitySchemes: { apiKey: { type: 'apiKey', in: 'user' } },
      },
    })

    expect((document.servers as { production: { security: unknown } }).production.security).toEqual([
      { $ref: '#/components/securitySchemes/apiKey' },
    ])
  })

  it('inlines OAuth server security with a scopes array', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      servers: {
        production: {
          url: 'broker.example.com',
          protocol: 'mqtt',
          security: [{ supportedOauthFlows: ['streetlights:on', 'streetlights:off'] }],
        },
      },
      components: {
        securitySchemes: {
          supportedOauthFlows: {
            type: 'oauth2',
            flows: {
              implicit: {
                authorizationUrl: 'https://example.com/auth',
                scopes: {
                  'streetlights:on': 'Switch on',
                  'streetlights:off': 'Switch off',
                  'streetlights:dim': 'Dim',
                },
              },
            },
          },
        },
      },
    })

    expect((document.servers as { production: { security: unknown } }).production.security).toEqual([
      {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: 'https://example.com/auth',
            availableScopes: {
              'streetlights:on': 'Switch on',
              'streetlights:off': 'Switch off',
              'streetlights:dim': 'Dim',
            },
          },
        },
        scopes: ['streetlights:on', 'streetlights:off'],
      },
    ])
  })

  it('renames scopes to availableScopes in component OAuth flows', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      components: {
        securitySchemes: {
          oauth: {
            type: 'oauth2',
            flows: {
              implicit: {
                authorizationUrl: 'https://example.com/auth',
                scopes: { read: 'Read', write: 'Write' },
              },
              password: {
                tokenUrl: 'https://example.com/token',
                scopes: { read: 'Read' },
              },
            },
          },
        },
      },
    })

    expect((document.components as { securitySchemes: { oauth: unknown } }).securitySchemes.oauth).toEqual({
      type: 'oauth2',
      flows: {
        implicit: {
          authorizationUrl: 'https://example.com/auth',
          availableScopes: { read: 'Read', write: 'Write' },
        },
        password: {
          tokenUrl: 'https://example.com/token',
          availableScopes: { read: 'Read' },
        },
      },
    })
  })

  // Channels & operations ----------------------------------------------------

  it('moves the channel path to address and uses a slug as the channel id', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      channels: {
        'user/signedup': {
          publish: { message: { $ref: '#/components/messages/userSignedUp' } },
        },
      },
    })

    expect(document.channels).toEqual({
      'user-signedup': {
        address: 'user/signedup',
        messages: { userSignedUp: { $ref: '#/components/messages/userSignedUp' } },
      },
    })
  })

  it('creates a receive operation from a publish operation', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      channels: {
        'user/signedup': {
          publish: {
            operationId: 'onUserSignedUp',
            summary: 'Receive sign-up events',
            message: { $ref: '#/components/messages/userSignedUp' },
          },
        },
      },
    })

    expect(document.operations).toEqual({
      onUserSignedUp: {
        action: 'receive',
        channel: { $ref: '#/channels/user-signedup' },
        summary: 'Receive sign-up events',
        messages: [{ $ref: '#/channels/user-signedup/messages/userSignedUp' }],
      },
    })
  })

  it('creates a send operation from a subscribe operation', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      channels: {
        'user/welcome': {
          subscribe: {
            operationId: 'sendWelcome',
            message: { $ref: '#/components/messages/welcome' },
          },
        },
      },
    })

    expect(document.operations).toEqual({
      sendWelcome: {
        action: 'send',
        channel: { $ref: '#/channels/user-welcome' },
        messages: [{ $ref: '#/channels/user-welcome/messages/welcome' }],
      },
    })
  })

  it('generates an operation key from the action and channel slug when operationId is missing', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      channels: {
        'user/signedup': {
          publish: { message: { $ref: '#/components/messages/userSignedUp' } },
        },
      },
    })

    expect(document.operations).toEqual({
      'receive-user-signedup': {
        action: 'receive',
        channel: { $ref: '#/channels/user-signedup' },
        messages: [{ $ref: '#/channels/user-signedup/messages/userSignedUp' }],
      },
    })
  })

  it('expands oneOf messages into multiple channel.messages entries', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      channels: {
        'user/events': {
          publish: {
            operationId: 'onUserEvent',
            message: {
              oneOf: [{ $ref: '#/components/messages/signup' }, { $ref: '#/components/messages/login' }],
            },
          },
        },
      },
    })

    expect((document.channels as Record<string, unknown>)['user-events']).toEqual({
      address: 'user/events',
      messages: {
        signup: { $ref: '#/components/messages/signup' },
        login: { $ref: '#/components/messages/login' },
      },
    })
    expect((document.operations as Record<string, unknown>).onUserEvent).toEqual({
      action: 'receive',
      channel: { $ref: '#/channels/user-events' },
      messages: [{ $ref: '#/channels/user-events/messages/signup' }, { $ref: '#/channels/user-events/messages/login' }],
    })
  })

  it('keeps channel description, parameters, bindings, and servers', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      channels: {
        'user/{userId}/signedup': {
          description: 'User signup channel.',
          servers: ['production'],
          parameters: {
            userId: { $ref: '#/components/parameters/userId' },
          },
          bindings: { amqp: { is: 'queue' } },
          publish: { message: { $ref: '#/components/messages/userSignedUp' } },
        },
      },
    })

    expect((document.channels as Record<string, unknown>)['user-userid-signedup']).toEqual({
      address: 'user/{userId}/signedup',
      description: 'User signup channel.',
      servers: [{ $ref: '#/servers/production' }],
      parameters: {
        userId: { $ref: '#/components/parameters/userId' },
      },
      bindings: { amqp: { is: 'queue' } },
      messages: { userSignedUp: { $ref: '#/components/messages/userSignedUp' } },
    })
  })

  it('creates both a receive and a send operation when a channel has both publish and subscribe', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      channels: {
        'chat/{roomId}': {
          publish: {
            operationId: 'sendMessage',
            message: { $ref: '#/components/messages/userMessage' },
          },
          subscribe: {
            operationId: 'receiveMessage',
            message: { $ref: '#/components/messages/serverMessage' },
          },
        },
      },
    })

    expect((document.channels as Record<string, unknown>)['chat-roomid']).toEqual({
      address: 'chat/{roomId}',
      messages: {
        userMessage: { $ref: '#/components/messages/userMessage' },
        serverMessage: { $ref: '#/components/messages/serverMessage' },
      },
    })
    expect(document.operations).toEqual({
      sendMessage: {
        action: 'receive',
        channel: { $ref: '#/channels/chat-roomid' },
        messages: [{ $ref: '#/channels/chat-roomid/messages/userMessage' }],
      },
      receiveMessage: {
        action: 'send',
        channel: { $ref: '#/channels/chat-roomid' },
        messages: [{ $ref: '#/channels/chat-roomid/messages/serverMessage' }],
      },
    })
  })

  it('leaves info, defaultContentType, and components.messages untouched', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      info: { title: 'Example', version: '1.0.0', description: 'A sample.' },
      defaultContentType: 'application/json',
      components: {
        messages: { ping: { payload: { type: 'object' } } },
        schemas: { Pong: { type: 'string' } },
      },
    })

    expect(document.info).toEqual({ title: 'Example', version: '1.0.0', description: 'A sample.' })
    expect(document.defaultContentType).toBe('application/json')
    expect(document.components).toEqual({
      messages: { ping: { payload: { type: 'object' } } },
      schemas: { Pong: { type: 'string' } },
    })
  })

  it('upgrades operation-level security like server security', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      channels: {
        'user/signup': {
          publish: {
            operationId: 'onSignup',
            security: [{ apiKey: [] }],
            message: { $ref: '#/components/messages/userSignedUp' },
          },
        },
      },
      components: {
        securitySchemes: { apiKey: { type: 'apiKey', in: 'user' } },
      },
    })

    expect((document.operations as { onSignup: { security: unknown } }).onSignup.security).toEqual([
      { $ref: '#/components/securitySchemes/apiKey' },
    ])
  })

  it('dedupes channel ids that slugify to the same value', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      channels: {
        'user/signedup': {
          publish: {
            operationId: 'fromSlash',
            message: { $ref: '#/components/messages/a' },
          },
        },
        'user.signedup': {
          publish: {
            operationId: 'fromDot',
            message: { $ref: '#/components/messages/b' },
          },
        },
      },
    })

    expect(Object.keys(document.channels as object)).toEqual(['user-signedup', 'user-signedup-2'])
    expect(document.operations).toEqual({
      fromSlash: {
        action: 'receive',
        channel: { $ref: '#/channels/user-signedup' },
        messages: [{ $ref: '#/channels/user-signedup/messages/a' }],
      },
      fromDot: {
        action: 'receive',
        channel: { $ref: '#/channels/user-signedup-2' },
        messages: [{ $ref: '#/channels/user-signedup-2/messages/b' }],
      },
    })
  })

  it('dedupes operation keys when an operationId collides with a generated one', () => {
    const document = upgradeFromTwoToThree({
      asyncapi: '2.6.0',
      channels: {
        'user/welcome': {
          // Generated key would be `send-user-welcome`.
          subscribe: { message: { $ref: '#/components/messages/welcome' } },
        },
        'admin/welcome': {
          // Hand-picked operationId collides with the auto-generated one above.
          subscribe: {
            operationId: 'send-user-welcome',
            message: { $ref: '#/components/messages/adminWelcome' },
          },
        },
      },
    })

    expect(Object.keys(document.operations as object)).toEqual(['send-user-welcome', 'send-user-welcome-2'])
  })

  // End-to-end ---------------------------------------------------------------

  it('upgrades a trimmed 2.6 streetlights-mqtt sample to its 3.0 shape', () => {
    // Input adapted from github.com/asyncapi/spec, tag v2.6.0,
    // examples/streetlights-mqtt.yml — trimmed to the parts the upgrader handles.
    const input = {
      asyncapi: '2.6.0',
      info: { title: 'Streetlights MQTT API', version: '1.0.0' },
      defaultContentType: 'application/json',
      servers: {
        production: {
          url: 'test.mosquitto.org:{port}',
          protocol: 'mqtt',
          description: 'Test broker',
          variables: { port: { default: '1883', enum: ['1883', '8883'] } },
          security: [{ apiKey: [] }],
        },
      },
      channels: {
        'smartylighting/streetlights/1/0/event/{streetlightId}/lighting/measured': {
          parameters: { streetlightId: { $ref: '#/components/parameters/streetlightId' } },
          publish: {
            operationId: 'receiveLightMeasurement',
            summary: 'Inform about environmental lighting conditions.',
            message: { $ref: '#/components/messages/lightMeasured' },
          },
        },
        'smartylighting/streetlights/1/0/action/{streetlightId}/turn/on': {
          parameters: { streetlightId: { $ref: '#/components/parameters/streetlightId' } },
          subscribe: {
            operationId: 'turnOn',
            message: { $ref: '#/components/messages/turnOnOff' },
          },
        },
      },
      components: {
        messages: {
          lightMeasured: { name: 'lightMeasured', payload: { type: 'object' } },
          turnOnOff: { name: 'turnOnOff', payload: { type: 'object' } },
        },
        parameters: {
          streetlightId: { description: 'The ID of the streetlight.', schema: { type: 'string' } },
        },
        securitySchemes: {
          apiKey: { type: 'apiKey', in: 'user' },
        },
      },
    }

    const expected = {
      asyncapi: '3.0.0',
      info: { title: 'Streetlights MQTT API', version: '1.0.0' },
      defaultContentType: 'application/json',
      servers: {
        production: {
          host: 'test.mosquitto.org:{port}',
          protocol: 'mqtt',
          description: 'Test broker',
          variables: { port: { default: '1883', enum: ['1883', '8883'] } },
          security: [{ $ref: '#/components/securitySchemes/apiKey' }],
        },
      },
      channels: {
        'smartylighting-streetlights-1-0-event-streetlightid-lighting-measured': {
          address: 'smartylighting/streetlights/1/0/event/{streetlightId}/lighting/measured',
          parameters: { streetlightId: { $ref: '#/components/parameters/streetlightId' } },
          messages: { lightMeasured: { $ref: '#/components/messages/lightMeasured' } },
        },
        'smartylighting-streetlights-1-0-action-streetlightid-turn-on': {
          address: 'smartylighting/streetlights/1/0/action/{streetlightId}/turn/on',
          parameters: { streetlightId: { $ref: '#/components/parameters/streetlightId' } },
          messages: { turnOnOff: { $ref: '#/components/messages/turnOnOff' } },
        },
      },
      operations: {
        receiveLightMeasurement: {
          action: 'receive',
          channel: { $ref: '#/channels/smartylighting-streetlights-1-0-event-streetlightid-lighting-measured' },
          summary: 'Inform about environmental lighting conditions.',
          messages: [
            {
              $ref: '#/channels/smartylighting-streetlights-1-0-event-streetlightid-lighting-measured/messages/lightMeasured',
            },
          ],
        },
        turnOn: {
          action: 'send',
          channel: { $ref: '#/channels/smartylighting-streetlights-1-0-action-streetlightid-turn-on' },
          messages: [
            {
              $ref: '#/channels/smartylighting-streetlights-1-0-action-streetlightid-turn-on/messages/turnOnOff',
            },
          ],
        },
      },
      components: {
        messages: {
          lightMeasured: { name: 'lightMeasured', payload: { type: 'object' } },
          turnOnOff: { name: 'turnOnOff', payload: { type: 'object' } },
        },
        parameters: {
          streetlightId: { description: 'The ID of the streetlight.', schema: { type: 'string' } },
        },
        securitySchemes: {
          apiKey: { type: 'apiKey', in: 'user' },
        },
      },
    }

    expect(upgradeFromTwoToThree(input)).toEqual(expected)
  })
})
