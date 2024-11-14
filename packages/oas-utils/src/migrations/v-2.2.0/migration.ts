import type { v_2_1_0 } from '@/migrations/v-2.1.0/types.generated'

import type { v_2_2_0 } from './types.generated'

/** V-2.1.0 to V-2.2.0 migration */
export const migrate_v_2_2_0 = (
  data: v_2_1_0.DataRecord,
): v_2_2_0.DataRecord => {
  console.info('Performing data migration v-2.1.0 to v-2.2.0')

  console.log('TODO: this')

  return data as v_2_2_0.DataRecord
}
