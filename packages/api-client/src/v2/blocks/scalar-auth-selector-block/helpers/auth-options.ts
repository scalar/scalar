import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

type AuthOption = { label: string; payload: SecuritySchemeObject }

/** Predefined authentication options */
export const authOptions: Record<string, AuthOption> = {
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
  oauth2Implicit: {
    label: 'Oauth2 Implicit Flow',
    payload: {
      type: 'oauth2',
      flows: {
        implicit: {
          authorizationUrl: '',
          'x-scalar-client-id': '',
          'x-scalar-redirect-uri': '',
          'x-scalar-secret-token': '',
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
          'x-scalar-client-id': '',
          'x-scalar-username': '',
          'x-scalar-password': '',
          'x-scalar-secret-token': '',
          'x-scalar-client-secret': '',
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
          'x-scalar-client-id': '',
          'x-scalar-secret-token': '',
          'x-scalar-client-secret': '',
          'x-scalar-credentials-location': '',
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
          'x-scalar-client-id': '',
          'x-scalar-client-secret': '',
          'x-scalar-redirect-uri': '',
          'x-scalar-credentials-location': '',
          'x-usePkce': 'no',
          scopes: {},
        },
      },
    },
  },
}
