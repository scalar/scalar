import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

/**
 * Minimal AsyncAPI description for the public WebSocket.org echo service.
 * Used by the channel-operation playground to test connect, send, and message log UI.
 */
export const echoWebsocketAsyncApiDocument = {
  asyncapi: '3.1.0',

  info: {
    title: 'WebSocket Echo Test',
    version: '1.0.0',
    description:
      'Connects to wss://echo.websocket.org — a public echo server that returns every message you send.',
  },

  defaultContentType: 'application/json',

  servers: {
    echo: {
      host: 'echo.websocket.org',
      protocol: 'wss',
      description: 'WebSocket.org echo service',

      security: [
        {
          basicAuth: [],
        },
      ],
    },

    local: {
      host: 'localhost:8080',
      protocol: 'ws',
      description: 'Local WebSocket server (for server switching)',

      security: [
        {
          basicAuth: [],
        },
      ],
    },
  },

  components: {
    securitySchemes: {
      basicAuth: {
        type: 'http',
        scheme: 'basic',
      },
    },
  },

  'x-scalar-selected-server': 'echo',

  channels: {
    echo: {
      address: '/',
      description: 'Bidirectional echo endpoint',

      messages: {
        echoPayload: {
          name: 'echoPayload',
          title: 'Echo payload',

          payload: {
            type: 'object',

            properties: {
              message: {
                type: 'string',
                examples: ['Hello from Scalar'],
              },
            },

            required: ['message'],
          },
        },
      },
    },
  },

  operations: {
    sendEchoMessage: {
      action: 'send',

      channel: {
        $ref: '#/channels/echo',
      },

      title: 'Send echo message',

      description:
        'Connect and send JSON; the server echoes it back in the message log.',

      messages: [
        {
          $ref: '#/channels/echo/messages/echoPayload',
        },
      ],

      bindings: {
        ws: {
          bindingVersion: '0.1.0',
          method: 'GET',
        },
      },
    },

    listenOnEcho: {
      action: 'receive',

      channel: {
        $ref: '#/channels/echo',
      },

      title: 'Listen on echo',

      description:
        'Connect and listen; use the Message tab to send while connected.',

      messages: [
        {
          $ref: '#/channels/echo/messages/echoPayload',
        },
      ],

      bindings: {
        ws: {
          bindingVersion: '0.1.0',
          method: 'GET',
        },
      },
    },
  },
} as unknown as AsyncApiDocument

export const ECHO_WEBSOCKET_DOCUMENT_SLUG = 'echo-websocket'

/** Default channel for the playground (single echo endpoint). */
export const ECHO_WEBSOCKET_DEFAULT_CHANNEL = 'echo'

/** @deprecated Use channel-centric navigation with {@link ECHO_WEBSOCKET_DEFAULT_CHANNEL}. */
export const ECHO_WEBSOCKET_DEFAULT_OPERATION = 'sendEchoMessage'

export const ECHO_WEBSOCKET_CONNECTION_URL = 'wss://echo.websocket.org'
