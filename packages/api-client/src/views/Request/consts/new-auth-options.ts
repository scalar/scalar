import type { SecurityScheme, SecuritySchemePayload } from '@scalar/oas-utils/entities/spec'
import type { Entries } from 'type-fest'
import type { ScalarComboboxOptionGroup } from '@scalar/components'

export type SecuritySchemeOption = {
  id: SecurityScheme['uid']
  label: string
  isDeletable?: boolean
  payload?: SecuritySchemePayload
}

export type SecuritySchemeGroup = ScalarComboboxOptionGroup<SecuritySchemeOption>

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
      nameKey: 'apiKeyCookie',
    },
  },
  apiKeyHeader: {
    label: 'API Key in Headers',
    payload: {
      type: 'apiKey',
      in: 'header',
      nameKey: 'apiKeyHeader',
    },
  },
  apiKeyQuery: {
    label: 'API Key in Query Params',
    payload: {
      type: 'apiKey',
      in: 'query',
      nameKey: 'apiKeyQuery',
    },
  },
  httpBasic: {
    label: 'HTTP Basic',
    payload: {
      type: 'http',
      scheme: 'basic',
      nameKey: 'httpBasic',
    },
  },
  httpBearer: {
    label: 'HTTP Bearer',
    payload: {
      type: 'http',
      scheme: 'bearer',
      nameKey: 'httpBearer',
    },
  },
  oauth2Implicit: {
    label: 'Oauth2 Implicit Flow',
    payload: {
      type: 'oauth2',
      nameKey: 'oauth2Implicit',
      flows: {
        implicit: {
          type: 'implicit',
        },
      },
    },
  },
  oauth2Password: {
    label: 'Oauth2 Password Flow',
    payload: {
      type: 'oauth2',
      nameKey: 'oauth2Password',
      flows: {
        password: {
          type: 'password',
        },
      },
    },
  },
  oauth2ClientCredentials: {
    label: 'Oauth2 Client Credentials',
    payload: {
      type: 'oauth2',
      nameKey: 'oauth2ClientCredentials',
      flows: {
        clientCredentials: {
          type: 'clientCredentials',
        },
      },
    },
  },
  oauth2AuthorizationFlow: {
    label: 'Oauth2 Authorization Code',
    payload: {
      type: 'oauth2',
      nameKey: 'oauth2AuthorizationFlow',
      flows: {
        authorizationCode: {
          type: 'authorizationCode',
        },
      },
    },
  },
} as const

const entries = Object.entries(ADD_AUTH_DICT) as Entries<typeof ADD_AUTH_DICT>

/** Options for the dropdown to add new auth */
export const ADD_AUTH_OPTIONS: SecuritySchemeOption[] = entries.map(
  ([id, value]) =>
    ({
      id: id as SecurityScheme['uid'],
      isDeletable: false,
      ...value,
    }) as const,
)
