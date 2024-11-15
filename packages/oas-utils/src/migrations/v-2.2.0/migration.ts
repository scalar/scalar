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
    } satisfies v_2_2_0.SecurityScheme
  }

  // HTTP
  if (scheme.type === 'http' && auth.type === 'http') {
    return {
      ...scheme,
      username: auth.username,
      password: auth.password,
      token: auth.token,
    } satisfies v_2_2_0.SecurityScheme
  }

  // OAuth

  return null
}

/** V-2.1.0 to V-2.2.0 migration */
export const migrate_v_2_2_0 = (
  data: v_2_1_0.DataRecord,
): v_2_2_0.DataRecord => {
  console.info('Performing data migration v-2.1.0 to v-2.2.0')

  const securitySchemes = Object.values(data.securitySchemes).reduce<
    v_2_2_0.DataRecord['securitySchemes']
  >((prev, s) => {
    const collection = Object.values(data.collections).find((c) =>
      c.securitySchemes.includes(s.uid),
    )
    const auth = collection?.auth?.[s.uid]
    if (!auth) return prev

    const newScheme = migrateSecurityScheme(s, auth)
    if (newScheme) prev[s.uid] = newScheme

    return prev
  }, {})

  // No changes to servers
  const servers = data.servers as v_2_2_0.DataRecord['servers']

  return {
    ...data,
    securitySchemes,
    servers,
  } satisfies v_2_2_0.DataRecord
}
