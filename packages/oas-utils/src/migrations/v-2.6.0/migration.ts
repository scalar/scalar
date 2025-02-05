import type { v_2_5_0 } from '@/migrations/v-2.5.0/types.generated'

import type { v_2_6_0 } from './types.generated'

/** V-2.5.0 to V-2.6.0 migration */
export const migrate_v_2_6_0 = (
  data: v_2_5_0.DataRecord,
): v_2_6_0.DataRecord => {
  console.info('Performing data migration v-2.5.0 to v-2.6.0')

  const requests = Object.values(data.requests).reduce<
    v_2_6_0.DataRecord['requests']
  >((prev, request) => {
    const updatedRequest = request as v_2_6_0.Request
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

  const servers = Object.entries(data.servers).reduce<
    v_2_6_0.DataRecord['servers']
  >((prev, [uid, server]) => {
    const updatedServer = {
      ...server,
      variables: server.variables
        ? Object.fromEntries(
            Object.entries(server.variables).map(([key, variable]) => [
              key,
              {
                ...variable,
                enum:
                  variable.enum && variable.enum.length > 0
                    ? [variable.enum[0], ...variable.enum.slice(1)]
                    : undefined,
                default:
                  variable.default !== undefined
                    ? String(variable.default)
                    : undefined,
              },
            ]),
          )
        : undefined,
    } as v_2_6_0.Server

    prev[uid] = updatedServer
    return prev
  }, {})

  const workspaces = Object.entries(data.workspaces).reduce<
    v_2_6_0.DataRecord['workspaces']
  >((prev, [uid, workspace]) => {
    const updatedWorkspace = {
      ...workspace,
      selectedHttpClient: workspace.selectedHttpClient || {
        // Provide default values for selectedHttpClient
        name: 'defaultClient',
        version: '1.0',
      },
    }

    prev[uid] = updatedWorkspace
    return prev
  }, {})

  return {
    ...data,
    requests,
    servers,
    workspaces,
  } satisfies v_2_6_0.DataRecord
}
