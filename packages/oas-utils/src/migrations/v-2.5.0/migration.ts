import type { v_2_4_0 } from '@/migrations/v-2.4.0/types.generated'

import type { v_2_5_0 } from './types.generated'

/** V-2.4.0 to V-2.5.0 migration */
export const migrate_v_2_5_0 = (data: v_2_4_0.DataRecord): v_2_5_0['DataRecord'] => {
  console.info('Performing data migration v-2.4.0 to v-2.5.0')

  const cookies = Object.entries(data.cookies || {}).reduce<Record<string, v_2_5_0['Cookie']>>((acc, [key, cookie]) => {
    acc[key] = {
      ...cookie,
      uid: cookie.uid,
    } satisfies v_2_5_0['Cookie']
    return acc
  }, {})

  const collections = Object.entries(data.collections || {}).reduce<Record<string, v_2_5_0['Collection']>>(
    (acc, [key, collection]) => {
      acc[key] = {
        ...collection,
        info: collection.info ?? {
          title: 'API',
          version: '1.0',
        },
        uid: collection.uid,
        selectedSecuritySchemeUids: collection.selectedSecuritySchemeUids,
        servers: collection.servers.map((uid) => uid),
        tags: collection.tags.map((uid) => uid),
        requests: collection.requests.map((uid) => uid),
        children: collection.children.map((uid) => uid),
        selectedServerUid: collection.selectedServerUid,
        useCollectionSecurity: false,
      } satisfies v_2_5_0['Collection']
      return acc
    },
    {},
  )

  const environments = Object.entries(data.environments || {}).reduce<Record<string, v_2_5_0['Environment']>>(
    (acc, [key, environment]) => {
      acc[key] = {
        ...environment,
        uid: environment.uid,
      } satisfies v_2_5_0['Environment']
      return acc
    },
    {},
  )

  const requests = Object.entries(data.requests || {}).reduce<Record<string, v_2_5_0['Request']>>(
    (acc, [key, request]) => {
      // Skip 'connect' operations as they are not supported in v-2.5.0
      if (request.method === 'connect') {
        return acc
      }

      acc[key] = {
        ...request,
        uid: request.uid,
        servers: request.servers,
        selectedServerUid: request.selectedServerUid,
        examples: request.examples,
        selectedSecuritySchemeUids: request.selectedSecuritySchemeUids,
        method: request.method,
      } satisfies v_2_5_0['Request']
      return acc
    },
    {},
  )

  const requestExamples = Object.entries(data.requestExamples || {}).reduce<Record<string, v_2_5_0['RequestExample']>>(
    (acc, [key, example]) => {
      const headers = example.parameters.headers

      // Check if "Accept" header exists
      const hasAcceptHeader = headers.some((header) => header.key.toLowerCase() === 'accept')

      if (!hasAcceptHeader) {
        // Add "Accept" header as the first entry
        headers.unshift({ key: 'Accept', value: '*/*', enabled: true })
      }

      // Update the example with potentially modified headers
      acc[key] = {
        ...example,
        uid: example.uid,
        requestUid: example.requestUid,
        parameters: {
          ...example.parameters,
          headers,
        },
      }
      return acc
    },
    {},
  )

  const securitySchemes = Object.entries(data.securitySchemes || {}).reduce<Record<string, v_2_5_0['SecurityScheme']>>(
    (acc, [key, securityScheme]) => {
      acc[key] = {
        ...securityScheme,
        uid: securityScheme.uid,
      } satisfies v_2_5_0['SecurityScheme']
      return acc
    },
    {},
  )

  const servers = Object.entries(data.servers || {}).reduce<Record<string, v_2_5_0['Server']>>((acc, [key, server]) => {
    acc[key] = {
      ...server,
      uid: server.uid,
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
          default: variable.default ?? '',
          description: variable.description ?? '',
          ...(variable.enum?.length && { enum: variable.enum as [string, ...string[]] }),
        }
        return variablesAcc
      }, {}),
    }
    return acc
  }, {})

  const tags = Object.entries(data.tags || {}).reduce<Record<string, v_2_5_0['Tag']>>((acc, [key, tag]) => {
    acc[key] = {
      ...tag,
      uid: tag.uid,
      children: tag.children,
    } satisfies v_2_5_0['Tag']
    return acc
  }, {})

  const workspaces = Object.entries(data.workspaces || {}).reduce<Record<string, v_2_5_0['Workspace']>>(
    (acc, [key, workspace]) => {
      acc[key] = {
        ...workspace,
        uid: workspace.uid,
        collections: workspace.collections.map((uid) => uid),
        cookies: workspace.cookies.map((uid) => uid),
        selectedHttpClient: {
          targetKey: 'shell',
          clientKey: 'curl',
        },
      }
      return acc
    },
    {},
  )

  return {
    ...data,
    collections,
    cookies,
    environments,
    requests,
    requestExamples,
    securitySchemes,
    servers,
    tags,
    workspaces,
  } satisfies v_2_5_0['DataRecord']
}
