import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

type AuthOption = { label: string; payload: SecuritySchemeObject }

/** Predefined authentication options */
export const authOptions = {
  apiKeyCookie: {
    label: 'API Key in Cookies',
    payload: {
      type: 'apiKey',
      in: 'cookie',
      name: 'apiKeyCookie',
    },
  },
  apiKeyHeader: {
    label: 'API Key in Headers',
    payload: {
      type: 'apiKey',
      in: 'header',
      name: 'apiKeyHeader',
    },
  },
  apiKeyQuery: {
    label: 'API Key in Query Params',
    payload: {
      type: 'apiKey',
      in: 'query',
      name: 'apiKeyQuery',
    },
  },
  httpBasic: {
    label: 'HTTP Basic',
    payload: {
      type: 'http',
      scheme: 'basic',
    },
  },
  httpBearer: {
    label: 'HTTP Bearer',
    payload: {
      type: 'http',
      scheme: 'bearer',
    },
  },
  oauth2DeviceAuthorization: {
    label: 'OAuth2 Device Authorization',
    payload: {
      type: 'oauth2',
      flows: { deviceAuthorization: { deviceAuthorizationUrl: '', tokenUrl: '', refreshUrl: '', scopes: {} } },
    },
  },
  oauth2Implicit: {
    label: 'Oauth2 Implicit Flow',
    payload: {
      type: 'oauth2',
      flows: {
        implicit: {
          authorizationUrl: '',
          refreshUrl: '',
          scopes: {},
        },
      },
    },
  },
  oauth2Password: {
    label: 'Oauth2 Password Flow',
    payload: {
      type: 'oauth2',
      flows: {
        password: {
          tokenUrl: '',
          refreshUrl: '',
          scopes: {},
        },
      },
    },
  },
  oauth2ClientCredentials: {
    label: 'Oauth2 Client Credentials',
    payload: {
      type: 'oauth2',
      flows: {
        clientCredentials: {
          tokenUrl: '',
          refreshUrl: '',
          scopes: {},
        },
      },
    },
  },
  oauth2AuthorizationFlow: {
    label: 'Oauth2 Authorization Code',
    payload: {
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: '',
          tokenUrl: '',
          refreshUrl: '',
          'x-usePkce': 'no',
          scopes: {},
        },
      },
    },
  },
} satisfies Record<string, AuthOption>
