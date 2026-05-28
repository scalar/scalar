import { describe, expect, it } from 'vitest'

import { upgradeFromOneToTwo } from './upgrade-from-one-to-two'

describe('upgradeFromOneToTwo', () => {
  it('bumps an AsyncAPI 1.x document to 2.6.0', () => {
    const document = upgradeFromOneToTwo({ asyncapi: '1.2.0', info: {} })

    expect(document.asyncapi).toBe('2.6.0')
  })

  it('leaves non-1.x documents untouched', () => {
    const document = { asyncapi: '3.0.0', info: {} }

    expect(upgradeFromOneToTwo(document)).toBe(document)
  })

  it('converts the servers array to a keyed map', () => {
    const document = upgradeFromOneToTwo({
      asyncapi: '1.2.0',
      servers: [
        { url: 'api.example.com', scheme: 'mqtt', description: 'Production' },
        { url: 'staging.example.com', scheme: 'mqtt', description: 'Staging' },
      ],
    })

    expect(document.servers).toEqual({
      production: { url: 'api.example.com', protocol: 'mqtt', description: 'Production' },
      staging: { url: 'staging.example.com', protocol: 'mqtt', description: 'Staging' },
    })
  })

  it('renames scheme to protocol and schemeVersion to protocolVersion', () => {
    const document = upgradeFromOneToTwo({
      asyncapi: '1.2.0',
      servers: [{ url: 'api.example.com', scheme: 'amqp', schemeVersion: '0.9.1' }],
    })

    expect(document.servers).toEqual({
      'server-0': { url: 'api.example.com', protocol: 'amqp', protocolVersion: '0.9.1' },
    })
  })

  it('slugifies description to generate server keys, falling back to server-N when absent', () => {
    const document = upgradeFromOneToTwo({
      asyncapi: '1.2.0',
      servers: [
        { url: 'a.example.com', scheme: 'mqtt', description: 'My Production!' },
        { url: 'b.example.com', scheme: 'mqtt' },
        { url: 'c.example.com', scheme: 'mqtt', description: 'My Production!' },
      ],
    })

    expect(document.servers).toEqual({
      'my-production': { url: 'a.example.com', protocol: 'mqtt', description: 'My Production!' },
      'server-1': { url: 'b.example.com', protocol: 'mqtt' },
      'my-production-2': { url: 'c.example.com', protocol: 'mqtt', description: 'My Production!' },
    })
  })

  it('renames topics to channels', () => {
    const document = upgradeFromOneToTwo({
      asyncapi: '1.2.0',
      topics: {
        'user.signup': {
          publish: { $ref: '#/components/messages/userSignedUp' },
        },
      },
    })

    expect(document.topics).toBeUndefined()
    expect(document.channels).toEqual({
      'user.signup': {
        publish: { message: { $ref: '#/components/messages/userSignedUp' } },
      },
    })
  })

  it('prepends baseTopic to every channel name and removes baseTopic', () => {
    const document = upgradeFromOneToTwo({
      asyncapi: '1.2.0',
      baseTopic: 'smartylighting.streetlights.1.0',
      topics: {
        'event.lighting.measured': {
          publish: { $ref: '#/components/messages/lightMeasured' },
        },
      },
    })

    expect(document.baseTopic).toBeUndefined()
    expect(document.channels).toEqual({
      'smartylighting.streetlights.1.0.event.lighting.measured': {
        publish: { message: { $ref: '#/components/messages/lightMeasured' } },
      },
    })
  })

  it('wraps publish/subscribe $ref in a message object', () => {
    const document = upgradeFromOneToTwo({
      asyncapi: '1.2.0',
      topics: {
        'user.signup': {
          publish: { $ref: '#/components/messages/userSignedUp' },
          subscribe: { $ref: '#/components/messages/userConfirmation' },
        },
      },
    })

    expect(document.channels).toEqual({
      'user.signup': {
        publish: { message: { $ref: '#/components/messages/userSignedUp' } },
        subscribe: { message: { $ref: '#/components/messages/userConfirmation' } },
      },
    })
  })

  it('wraps publish/subscribe oneOf in a message object', () => {
    const document = upgradeFromOneToTwo({
      asyncapi: '1.2.0',
      topics: {
        'user.events': {
          publish: {
            oneOf: [{ $ref: '#/components/messages/signup' }, { $ref: '#/components/messages/login' }],
          },
        },
      },
    })

    expect(document.channels).toEqual({
      'user.events': {
        publish: {
          message: {
            oneOf: [{ $ref: '#/components/messages/signup' }, { $ref: '#/components/messages/login' }],
          },
        },
      },
    })
  })

  it('wraps publish/subscribe oneOf with inline messages in a message object', () => {
    const document = upgradeFromOneToTwo({
      asyncapi: '1.2.0',
      topics: {
        'user.events': {
          publish: {
            oneOf: [
              { summary: 'Signup', payload: { type: 'object', properties: { id: { type: 'string' } } } },
              { summary: 'Login', payload: { type: 'object', properties: { token: { type: 'string' } } } },
            ],
          },
        },
      },
    })

    expect(document.channels).toEqual({
      'user.events': {
        publish: {
          message: {
            oneOf: [
              { summary: 'Signup', payload: { type: 'object', properties: { id: { type: 'string' } } } },
              { summary: 'Login', payload: { type: 'object', properties: { token: { type: 'string' } } } },
            ],
          },
        },
      },
    })
  })

  it('wraps inline publish/subscribe message in a message object', () => {
    const document = upgradeFromOneToTwo({
      asyncapi: '1.2.0',
      topics: {
        'user.signup': {
          publish: {
            summary: 'A user signed up.',
            payload: { type: 'object', properties: { id: { type: 'string' } } },
          },
        },
      },
    })

    expect(document.channels).toEqual({
      'user.signup': {
        publish: {
          message: {
            summary: 'A user signed up.',
            payload: { type: 'object', properties: { id: { type: 'string' } } },
          },
        },
      },
    })
  })

  it('converts channel parameters array to a name-keyed map', () => {
    const document = upgradeFromOneToTwo({
      asyncapi: '1.2.0',
      topics: {
        'user.{userId}.signup': {
          parameters: [{ name: 'userId', description: 'Id of the user.', schema: { type: 'string' } }],
          publish: { $ref: '#/components/messages/userSignedUp' },
        },
      },
    })

    expect(document.channels).toEqual({
      'user.{userId}.signup': {
        parameters: {
          userId: { description: 'Id of the user.', schema: { type: 'string' } },
        },
        publish: { message: { $ref: '#/components/messages/userSignedUp' } },
      },
    })
  })

  it('migrates stream to a single "/" channel and drops framing', () => {
    const document = upgradeFromOneToTwo({
      asyncapi: '1.2.0',
      stream: {
        framing: { type: 'chunked', delimiter: '\r\n' },
        read: [{ $ref: '#/components/messages/chatMessage' }],
        write: [{ $ref: '#/components/messages/outgoing' }],
      },
    })

    expect(document.stream).toBeUndefined()
    expect(document.channels).toEqual({
      '/': {
        subscribe: { message: { oneOf: [{ $ref: '#/components/messages/chatMessage' }] } },
        publish: { message: { oneOf: [{ $ref: '#/components/messages/outgoing' }] } },
      },
    })
  })

  it('migrates events to a single "/" channel', () => {
    const document = upgradeFromOneToTwo({
      asyncapi: '1.2.0',
      events: {
        receive: [{ $ref: '#/components/messages/incoming' }],
        send: [{ $ref: '#/components/messages/outgoing' }],
      },
    })

    expect(document.events).toBeUndefined()
    expect(document.channels).toEqual({
      '/': {
        subscribe: { message: { oneOf: [{ $ref: '#/components/messages/incoming' }] } },
        publish: { message: { oneOf: [{ $ref: '#/components/messages/outgoing' }] } },
      },
    })
  })

  it('leaves info, components, and security untouched', () => {
    const document = upgradeFromOneToTwo({
      asyncapi: '1.2.0',
      info: { title: 'Example', version: '1.0.0', description: 'A sample.' },
      security: [{ apiKey: [] }],
      components: {
        schemas: { User: { type: 'object', properties: { id: { type: 'string' } } } },
        messages: { userSignUp: { payload: { $ref: '#/components/schemas/User' } } },
        parameters: { userId: { name: 'userId', schema: { type: 'string' } } },
        securitySchemes: { apiKey: { type: 'apiKey', in: 'user' } },
      },
    })

    expect(document.info).toEqual({ title: 'Example', version: '1.0.0', description: 'A sample.' })
    expect(document.security).toEqual([{ apiKey: [] }])
    expect(document.components).toEqual({
      schemas: { User: { type: 'object', properties: { id: { type: 'string' } } } },
      messages: { userSignUp: { payload: { $ref: '#/components/schemas/User' } } },
      parameters: { userId: { name: 'userId', schema: { type: 'string' } } },
      securitySchemes: { apiKey: { type: 'apiKey', in: 'user' } },
    })
  })

  it('upgrades the official 1.2 streetlights sample to its 2.0 shape', () => {
    // Input: AsyncAPI 1.2 streetlights sample.
    // Source: github.com/asyncapi/spec, tag 1.2.0, test/docs/sample.yml
    const input = {
      asyncapi: '1.2.0',
      info: {
        title: 'Streetlights API',
        version: '1.0.0',
        description: 'The Smartylighting Streetlights API allows you to remotely manage the city lights.\n',
        license: { name: 'Apache 2.0', url: 'https://www.apache.org/licenses/LICENSE-2.0' },
      },
      baseTopic: 'smartylighting.streetlights.1.0',
      servers: [
        {
          url: 'api.streetlights.smartylighting.com:{port}',
          scheme: 'mqtt',
          description: 'Test broker',
          variables: {
            port: {
              description: 'Secure connection (TLS) is available through port 8883.',
              default: '1883',
              enum: ['1883', '8883'],
            },
          },
        },
      ],
      security: [{ apiKey: [] }],
      topics: {
        'event.{streetlightId}.lighting.measured': {
          parameters: [{ $ref: '#/components/parameters/streetlightId' }],
          publish: { $ref: '#/components/messages/lightMeasured' },
        },
        'action.{streetlightId}.turn.on': {
          parameters: [{ $ref: '#/components/parameters/streetlightId' }],
          subscribe: { $ref: '#/components/messages/turnOnOff' },
        },
      },
      components: {
        messages: {
          lightMeasured: {
            summary: 'Inform about environmental lighting conditions for a particular streetlight.',
            payload: { $ref: '#/components/schemas/lightMeasuredPayload' },
          },
          turnOnOff: {
            summary: 'Command a particular streetlight to turn the lights on or off.',
            payload: { $ref: '#/components/schemas/turnOnOffPayload' },
          },
        },
        schemas: {
          lightMeasuredPayload: {
            type: 'object',
            properties: { lumens: { type: 'integer', minimum: 0 } },
          },
          turnOnOffPayload: {
            type: 'object',
            properties: { command: { type: 'string', enum: ['on', 'off'] } },
          },
        },
        securitySchemes: {
          apiKey: { type: 'apiKey', in: 'user', description: 'Provide your API key as the user.' },
        },
        parameters: {
          streetlightId: {
            name: 'streetlightId',
            description: 'The ID of the streetlight.',
            schema: { type: 'string' },
          },
        },
      },
    }

    const expected = {
      asyncapi: '2.6.0',
      info: {
        title: 'Streetlights API',
        version: '1.0.0',
        description: 'The Smartylighting Streetlights API allows you to remotely manage the city lights.\n',
        license: { name: 'Apache 2.0', url: 'https://www.apache.org/licenses/LICENSE-2.0' },
      },
      servers: {
        'test-broker': {
          url: 'api.streetlights.smartylighting.com:{port}',
          protocol: 'mqtt',
          description: 'Test broker',
          variables: {
            port: {
              description: 'Secure connection (TLS) is available through port 8883.',
              default: '1883',
              enum: ['1883', '8883'],
            },
          },
        },
      },
      security: [{ apiKey: [] }],
      channels: {
        // Channel-level parameters were a `[{ $ref: '#/components/parameters/streetlightId' }]` array
        // in 1.x. The map key is derived from the last segment of the $ref so the parameter still
        // resolves to the same component.
        'smartylighting.streetlights.1.0.event.{streetlightId}.lighting.measured': {
          parameters: { streetlightId: { $ref: '#/components/parameters/streetlightId' } },
          publish: { message: { $ref: '#/components/messages/lightMeasured' } },
        },
        'smartylighting.streetlights.1.0.action.{streetlightId}.turn.on': {
          parameters: { streetlightId: { $ref: '#/components/parameters/streetlightId' } },
          subscribe: { message: { $ref: '#/components/messages/turnOnOff' } },
        },
      },
      components: {
        messages: {
          lightMeasured: {
            summary: 'Inform about environmental lighting conditions for a particular streetlight.',
            payload: { $ref: '#/components/schemas/lightMeasuredPayload' },
          },
          turnOnOff: {
            summary: 'Command a particular streetlight to turn the lights on or off.',
            payload: { $ref: '#/components/schemas/turnOnOffPayload' },
          },
        },
        schemas: {
          lightMeasuredPayload: {
            type: 'object',
            properties: { lumens: { type: 'integer', minimum: 0 } },
          },
          turnOnOffPayload: {
            type: 'object',
            properties: { command: { type: 'string', enum: ['on', 'off'] } },
          },
        },
        securitySchemes: {
          apiKey: { type: 'apiKey', in: 'user', description: 'Provide your API key as the user.' },
        },
        parameters: {
          streetlightId: {
            name: 'streetlightId',
            description: 'The ID of the streetlight.',
            schema: { type: 'string' },
          },
        },
      },
    }

    expect(upgradeFromOneToTwo(input)).toEqual(expected)
  })
})
