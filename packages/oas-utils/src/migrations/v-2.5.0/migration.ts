import type { v_2_4_0 } from '@/migrations/v-2.4.0/types.generated'

import type { v_2_5_0 } from './types.generated'

/** V-2.4.0 to V-2.5.0 migration */
export const migrate_v_2_5_0 = (
  data: v_2_4_0.DataRecord,
): v_2_5_0.DataRecord => {
  console.info('Performing data migration v-2.4.0 to v-2.5.0')

  const requests = Object.values(data.requests).reduce<
    v_2_5_0.DataRecord['requests']
  >((prev, request) => {
    const updatedRequest = request as v_2_5_0.Request
    if (
      !updatedRequest.selectedExampleUid &&
      updatedRequest.examples.length > 0
    ) {
      // Set the selectedExampleUid to the first example UID if not already set
      updatedRequest.selectedExampleUid = updatedRequest.examples[0]
    }

    prev[updatedRequest.uid] = updatedRequest
    return prev
  }, {})

  return {
    ...data,
    requests,
  } satisfies v_2_5_0.DataRecord
}
