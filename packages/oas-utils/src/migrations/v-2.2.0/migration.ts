import type { v_2_1_0 } from '@/migrations/v-2.1.0/types.generated'

import type { v_2_2_0 } from './types.generated'

/** Migrate security scheme from v-2.1.0 to v-2.2.0 */
const migrateSecurityScheme = (
  scheme: v_2_1_0.SecurityScheme,
  auth: v_2_1_0.Collection['auth'][string],
): v_2_2_0.SecurityScheme | null => {
  // API Key
  if (scheme.type === 'apiKey' && auth.type === 'apiKey') {
    return {
      ...scheme,
      value: auth.value,
    }
  }

  // HTTP
  if (scheme.type === 'http' && auth.type === 'http') {
    return {
      ...scheme,
      username: auth.username,
      password: auth.password,
      token: auth.token,
    }
  }

  // OAuth2
  if (scheme.type === 'oauth2') {
    const { flow, ..._scheme } = scheme

    // Implicit
    if (flow.type === 'implicit' && auth.type === 'oauth-implicit') {
      return {
        ..._scheme,
        flows: {
          implicit: {
            ...flow,
            'scopes': flow.scopes as Record<string, string>,
            'token': auth.token,
            'x-scalar-client-id': _scheme['x-scalar-client-id'],
          },
        },
      }
    }

    // Password
    if (flow.type === 'password' && auth.type === 'oauth-password') {
      return {
        ..._scheme,
        flows: {
          password: {
            ...flow,
            'username': auth.username,
            'password': auth.password,
            'token': auth.token,
            'clientSecret': auth.clientSecret,
            'scopes': flow.scopes as Record<string, string>,
            'x-scalar-client-id': _scheme['x-scalar-client-id'],
          },
        },
      } satisfies v_2_2_0.SecurityScheme
    }

    // Client Credentials
    if (flow.type === 'clientCredentials' && auth.type === 'oauth-clientCredentials') {
      return {
        ..._scheme,
        flows: {
          clientCredentials: {
            ...flow,
            'token': auth.token,
            'clientSecret': auth.clientSecret,
            'scopes': flow.scopes as Record<string, string>,
            'x-scalar-client-id': _scheme['x-scalar-client-id'],
          },
        },
      } satisfies v_2_2_0.SecurityScheme
    }

    // Authorization Code
    if (flow.type === 'authorizationCode' && auth.type === 'oauth-authorizationCode') {
      return {
        ..._scheme,
        flows: {
          authorizationCode: {
            ...flow,
            'token': auth.token,
            'clientSecret': auth.clientSecret,
            'scopes': flow.scopes as Record<string, string>,
            'x-scalar-client-id': _scheme['x-scalar-client-id'],
          },
        },
      } satisfies v_2_2_0.SecurityScheme
    }
  }

  return null
}

/** V-2.1.0 to V-2.2.0 migration */
export const migrate_v_2_2_0 = (data: v_2_1_0.DataRecord): v_2_2_0.DataRecord => {
  console.info('Performing data migration v-2.1.0 to v-2.2.0')

  const securitySchemes = Object.values(data.securitySchemes).reduce<v_2_2_0.DataRecord['securitySchemes']>(
    (prev, s) => {
      const collection = Object.values(data.collections).find((c) => c.securitySchemes.includes(s.uid))
      const auth = collection?.auth?.[s.uid]
      if (!auth) {
        return prev
      }

      const newScheme = migrateSecurityScheme(s, auth)
      if (newScheme) {
        prev[s.uid] = newScheme
      }

      return prev
    },
    {},
  )

  // No changes to servers
  const servers = data.servers as v_2_2_0.DataRecord['servers']

  return {
    ...data,
    securitySchemes,
    servers,
  } satisfies v_2_2_0.DataRecord
}
