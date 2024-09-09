import type { SecurityScheme } from '@scalar/oas-utils/entities/spec'
import type { Entries } from 'type-fest'

export type SecuritySchemeOption = {
  id: string
  label: string
  payload?: SecurityScheme
}

export type SecuritySchemeGroup = {
  id: string
  label: string
  options: SecuritySchemeOption[]
}

/**
 * Add auth options for Request Auth
 *
 * We store it as a dictionary first for quick lookups then convert to an array of options
 */
export const ADD_AUTH_DICT = {
  apiKey: {
    label: 'API Key',
    options: [
      {
        id: 'apiKeyCookie',
        label: 'API Key in Cookies',
        payload: {
          type: 'apiKey',
          in: 'cookie',
        },
      },
      {
        id: 'apiKeyHeader',
        label: 'API Key in Headers',
        payload: {
          type: 'apiKey',
          in: 'header',
        },
      },
      {
        id: 'apiKeyQuery',
        label: 'API Key in Query Params',
        payload: {
          type: 'apiKey',
          in: 'query',
        },
      },
    ],
  },
  http: {
    label: 'HTTP',
    options: [
      {
        id: 'httpBasic',
        label: 'HTTP Basic',
        payload: {
          type: 'http',
          scheme: 'basic',
        },
      },
      {
        id: 'httpBearer',
        label: 'HTTP Bearer',
        payload: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    ],
  },
  oauth2: {
    label: 'OAuth2',
    options: [
      {
        id: 'oauth2Implicit',
        label: 'Oauth2 Implicit Flow',
        payload: {
          type: 'oauth2',
          flow: {
            type: 'implicit',
          },
        },
      },
      {
        id: 'oauth2Password',
        label: 'Oauth2 Password Flow',
        payload: {
          type: 'oauth2',
          flow: {
            type: 'password',
          },
        },
      },
      {
        id: 'oauth2ClientCredentials',
        label: 'Oauth2 Client Credentials',
        payload: {
          type: 'oauth2',
          flow: {
            type: 'clientCredentials',
          },
        },
      },
      {
        id: 'oauth2AuthorizationFlow',
        label: 'Oauth2 Authorization Code',
        payload: {
          type: 'oauth2',
          flow: {
            type: 'authorizationCode',
            selectedScopes: [],
          },
        },
      },
    ],
  },
} as const

const entries = Object.entries(ADD_AUTH_DICT) as Entries<typeof ADD_AUTH_DICT>

/** Options for the dropdown to add new auth */
export const ADD_AUTH_OPTIONS: SecuritySchemeGroup[] = entries.map(
  ([id, value]) =>
    ({
      id,
      label: value.label,
      options: [...(value.options as unknown as SecuritySchemeOption[])],
    }) as SecuritySchemeGroup,
)
