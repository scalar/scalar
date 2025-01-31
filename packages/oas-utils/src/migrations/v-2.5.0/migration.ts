import type { v_2_4_0 } from '@/migrations/v-2.4.0/types.generated'

import type { v_2_5_0 } from './types.generated'

/** V-2.4.0 to V-2.5.0 migration */
export const migrate_v_2_5_0 = (
  data: v_2_4_0.DataRecord,
): v_2_5_0.DataRecord => {
  console.info('Performing data migration v-2.4.0 to v-2.5.0')

  const requestExamples = Object.entries(data.requestExamples || {}).reduce<
    Record<string, v_2_5_0.RequestExample>
  >((acc, [key, example]) => {
    const headers = example.parameters.headers

    // Check if "Accept" header exists
    const hasAcceptHeader = headers.some(
      (header) => header.key.toLowerCase() === 'accept',
    )

    if (!hasAcceptHeader) {
      // Add "Accept" header as the first entry
      headers.unshift({ key: 'Accept', value: '*/*', enabled: true })
    }

    // Update the example with potentially modified headers
    acc[key] = {
      ...example,
      parameters: {
        ...example.parameters,
        headers,
      },
    }
    return acc
  }, {})

  const servers = Object.entries(data.servers || {}).reduce<
    Record<string, v_2_5_0.Server>
  >((acc, [key, server]) => {
    acc[key] = {
      ...server,
      variables: Object.entries(server.variables || {}).reduce<
        Record<
          string,
          {
            enum?: [string, ...string[]]
            default: string
            description?: string
          }
        >
      >((variablesAcc, [variableKey, variable]) => {
        variablesAcc[variableKey] = {
          ...variable,
          enum:
            variable.enum && variable.enum.length > 0
              ? (variable.enum as [string, ...string[]])
              : undefined,
          default: variable.default ?? '',
          description: variable.description,
        }
        return variablesAcc
      }, {}),
    }
    return acc
  }, {})

  return {
    ...data,
    requestExamples,
    servers,
  } satisfies v_2_5_0.DataRecord
}
