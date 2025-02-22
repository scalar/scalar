import type { v_2_2_0 } from '@/migrations/v-2.2.0/types.generated'

import type { v_2_3_0 } from './types.generated'

/** V-2.2.0 to V-2.3.0 migration */
export const migrate_v_2_3_0 = (data: v_2_2_0.DataRecord): v_2_3_0.DataRecord => {
  console.info('Performing data migration v-2.2.0 to v-2.3.0')

  const environments = data.environments

  const workspaces = Object.values(data.workspaces).reduce<v_2_3_0.DataRecord['workspaces']>((prev, w) => {
    const workspaceEnvironments: Record<string, any> = {}

    Object.entries(environments).forEach(([envId, envData]) => {
      const parsedData = typeof envData.value === 'string' ? JSON.parse(envData.value) : envData.value
      if (envId === 'default') {
        Object.assign(workspaceEnvironments, parsedData)
      }
    })

    prev[w.uid] = {
      ...w,
      environments: workspaceEnvironments,
    }
    return prev
  }, {})

  const collections = Object.values(data.collections).reduce<v_2_3_0.DataRecord['collections']>((prev, c) => {
    prev[c.uid] = {
      ...c,
      'x-scalar-environments': c['x-scalar-environments'] || {},
    }
    return prev
  }, {})

  Object.values(workspaces).forEach((workspace) => {
    Object.entries(environments).forEach(([envKey, envData]) => {
      if (envKey !== 'default') {
        const parsedData = typeof envData.value === 'string' ? JSON.parse(envData.value) : envData.value
        const envName = envData.name
        Object.values(collections).forEach((collection) => {
          collection['x-scalar-environments'] = collection['x-scalar-environments'] || {}
          collection['x-scalar-environments'][envName] = {
            variables: parsedData,
          }
          if (workspace.activeEnvironmentId === envKey) {
            collection['x-scalar-active-environment'] = envName ?? ''
          }
        })
      }
    })
  })

  return {
    ...data,
    collections,
    workspaces,
  } satisfies v_2_3_0.DataRecord
}
