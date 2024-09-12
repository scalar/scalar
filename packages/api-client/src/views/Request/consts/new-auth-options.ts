import type { SecuritySchemePayload } from '@scalar/oas-utils/entities/spec'
import type { Entries } from 'type-fest'

export type SecuritySchemeOption = {
  id: string
  label: string
  payload?: SecuritySchemePayload
}

export type SecuritySchemeGroup = {
  label: string
  options: SecuritySchemeOption[]
}

/**
 * Add auth options for Request Auth
 *
 * We store it as a dictionary first for quick lookups then convert to an array of options
 */
export const ADD_AUTH_DICT = {
  apiKeyCookie: {
    label: 'API Key in Cookies',
    payload: {
      type: 'apiKey',
      in: 'cookie',
    },
  },
  apiKeyHeader: {
    label: 'API Key in Headers',
    payload: {
      type: 'apiKey',
      in: 'header',
    },
  },
  apiKeyQuery: {
    label: 'API Key in Query Params',
    payload: {
      type: 'apiKey',
      in: 'query',
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
      flow: {
        type: 'implicit',
      },
    },
  },
  oauth2Password: {
    label: 'Oauth2 Password Flow',
    payload: {
      type: 'oauth2',
      flow: {
        type: 'password',
      },
    },
  },
  oauth2ClientCredentials: {
    label: 'Oauth2 Client Credentials',
    payload: {
      type: 'oauth2',
      flow: {
        type: 'clientCredentials',
      },
    },
  },
  oauth2AuthorizationFlow: {
    label: 'Oauth2 Authorization Code',
    payload: {
      type: 'oauth2',
      flow: {
        type: 'authorizationCode',
      },
    },
  },
} as const

const entries = Object.entries(ADD_AUTH_DICT) as Entries<typeof ADD_AUTH_DICT>

/** Options for the dropdown to add new auth */
export const ADD_AUTH_OPTIONS: SecuritySchemeOption[] = entries.map(
  ([id, value]) =>
    ({
      id,
      isDeletable: false,
      ...value,
    }) as const,
)
