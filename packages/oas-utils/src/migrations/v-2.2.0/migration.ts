import type { v_2_1_0 } from '@/migrations/v-2.1.0/types.generated'

import type { v_2_2_0 } from './types.generated'

/** V-2.1.0 to V-2.2.0 migration */
export const migrate_v_2_2_0 = (
  data: v_2_1_0.DataRecord,
): v_2_2_0.DataRecord => {
  // console.info('Performing data migration v-2.1.0 to v-2.2.0')

  // const collections = data.collections
  // const cookies = Object.values(data.cookies).reduce((prev, c) => {
  //   prev[c.u] = c.
  //   return prev
  // }, {})
  // const environments = data.environments
  // const requestExamples = data.requestExamples
  // const requests = data.requests
  // const securitySchemes = data.securitySchemes
  // const servers = data.servers
  // const tags = data.tags
  // const workspaces = data.workspaces

  // return {
  //   collections,
  //   cookies,
  //   environments,
  //   requestExamples,
  //   requests,
  //   securitySchemes,
  //   servers,
  //   tags,
  //   workspaces,
  // } satisfies v_2_2_0.DataRecord
  return data as v_2_2_0.DataRecord
}
