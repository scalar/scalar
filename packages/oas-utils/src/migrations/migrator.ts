import { getLocalStorageVersion, parseLocalStorage } from '@/migrations/local-storage'
import { semverLessThan } from '@/migrations/semver'
import { migrate_v_2_1_0 } from '@/migrations/v-2.1.0/migration'
import { migrate_v_2_2_0 } from '@/migrations/v-2.2.0/migration'
import { migrate_v_2_3_0 } from '@/migrations/v-2.3.0/migration'
import { migrate_v_2_4_0 } from '@/migrations/v-2.4.0/migration'
import { migrate_v_2_5_0 } from '@/migrations/v-2.5.0/migration'
import type { v_2_5_0 } from '@/migrations/v-2.5.0/types.generated'

/** Handles all data migrations per entity */
export const migrator = (): v_2_5_0['DataArray'] => {
  const dataVersion = getLocalStorageVersion()
  console.info('Data version: ' + dataVersion)

  // First we gather all of the old data
  let data = {
    collections: parseLocalStorage('collection'),
    cookies: parseLocalStorage('cookie'),
    environments: parseLocalStorage('environment'),
    requestExamples: parseLocalStorage('requestExample'),
    requests: parseLocalStorage('request'),
    securitySchemes: parseLocalStorage('securityScheme'),
    servers: parseLocalStorage('server'),
    tags: parseLocalStorage('tag'),
    workspaces: parseLocalStorage('workspace'),
  } as any

  // 0.0.0 -> 2.1.0 migration
  if (semverLessThan(dataVersion, '2.1.0')) {
    data = migrate_v_2_1_0(data)
  }
  // 2.1.0 -> 2.2.0 migration
  if (semverLessThan(dataVersion, '2.2.0')) {
    data = migrate_v_2_2_0(data)
  }
  // 2.2.0 -> 2.3.0 migration
  if (semverLessThan(dataVersion, '2.3.0')) {
    data = migrate_v_2_3_0(data)
  }
  // 2.3.0 -> 2.4.0 migration
  if (semverLessThan(dataVersion, '2.4.0')) {
    data = migrate_v_2_4_0(data)
  }
  // 2.4.0 -> 2.5.0 migration
  if (semverLessThan(dataVersion, '2.5.0')) {
    data = migrate_v_2_5_0(data)
  }

  // Convert to data array
  data = {
    collections: Object.values(data.collections),
    cookies: Object.values(data.cookies),
    environments: Object.values(data.environments),
    requestExamples: Object.values(data.requestExamples),
    requests: Object.values(data.requests),
    securitySchemes: Object.values(data.securitySchemes),
    servers: Object.values(data.servers),
    tags: Object.values(data.tags),
    workspaces: Object.values(data.workspaces),
  } satisfies v_2_5_0['DataArray']

  return data
}
