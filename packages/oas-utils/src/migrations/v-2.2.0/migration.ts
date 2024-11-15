import type { v_2_1_0 } from '@/migrations/v-2.1.0/types.generated'

import type { v_2_2_0 } from './types.generated'

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
    if (!collection) return prev

    console.log(collection)
    // if (s.type === 'oauth') {
    // } else {
    //   prev[s.uid] = {
    //     ...s,
    //   } satisfies v_2_2_0.SecurityScheme
    // }
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
