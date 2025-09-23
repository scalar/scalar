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
      'x-scalar-secret-token': '',
    },
  },
  apiKeyHeader: {
    label: 'API Key in Headers',
    payload: {
      type: 'apiKey',
      in: 'header',
      name: 'apiKeyHeader',
      'x-scalar-secret-token': '',
    },
  },
  apiKeyQuery: {
    label: 'API Key in Query Params',
    payload: {
      type: 'apiKey',
      in: 'query',
      name: 'apiKeyQuery',
      'x-scalar-secret-token': '',
    },
  },
  httpBasic: {
    label: 'HTTP Basic',
    payload: {
      type: 'http',
      scheme: 'basic',
      'x-scalar-secret-token': '',
      'x-scalar-secret-username': '',
      'x-scalar-secret-password': '',
    },
  },
  httpBearer: {
    label: 'HTTP Bearer',
    payload: {
      type: 'http',
      scheme: 'bearer',
      'x-scalar-secret-token': '',
      'x-scalar-secret-username': '',
      'x-scalar-secret-password': '',
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
          'x-scalar-secret-client-id': '',
          'x-scalar-secret-redirect-uri': '',
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
          refreshUrl: '',
          'x-scalar-secret-client-id': '',
          'x-scalar-secret-username': '',
          'x-scalar-secret-password': '',
          'x-scalar-secret-token': '',
          'x-scalar-secret-client-secret': '',
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
          'x-scalar-secret-client-id': '',
          'x-scalar-secret-token': '',
          'x-scalar-secret-client-secret': '',
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
          'x-scalar-secret-client-id': '',
          'x-scalar-secret-client-secret': '',
          'x-scalar-secret-token': '',
          'x-scalar-secret-redirect-uri': '',
          'x-usePkce': 'no',
          scopes: {},
        },
      },
    },
  },
}
