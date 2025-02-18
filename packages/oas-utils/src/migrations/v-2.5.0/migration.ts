import type { v_2_4_0 } from '@/migrations/v-2.4.0/types.generated'

import type { v_2_5_0 } from './types.generated'
import type { Collection, Operation, RequestExample, SecurityScheme, Server, Tag } from '@/entities/spec'
import type { Workspace } from '@/entities/workspace'
import type { Cookie } from '@/entities/cookie/cookie'
import type { Environment } from '@/entities/environment/environment'

/** V-2.4.0 to V-2.5.0 migration */
export const migrate_v_2_5_0 = (data: v_2_4_0.DataRecord): v_2_5_0['DataRecord'] => {
  console.info('Performing data migration v-2.4.0 to v-2.5.0')

  const cookies = Object.entries(data.cookies || {}).reduce<Record<string, v_2_5_0['Cookie']>>((acc, [key, cookie]) => {
    acc[key] = {
      ...cookie,
      uid: cookie.uid as Cookie['uid'],
    } satisfies v_2_5_0['Cookie']
    return acc
  }, {})

  const collections = Object.entries(data.collections || {}).reduce<Record<string, v_2_5_0['Collection']>>(
    (acc, [key, collection]) => {
      acc[key] = {
        ...collection,
        uid: collection.uid as Collection['uid'],
        selectedSecuritySchemeUids: collection.selectedSecuritySchemeUids as Collection['selectedSecuritySchemeUids'],
        servers: collection.servers.map((uid) => uid as Server['uid']),
        tags: collection.tags.map((uid) => uid as Tag['uid']),
        requests: collection.requests.map((uid) => uid as Operation['uid']),
        children: collection.children.map((uid) => uid as Operation['uid'] | Tag['uid']),
      } satisfies v_2_5_0['Collection']
      return acc
    },
    {},
  )

  const environments = Object.entries(data.environments || {}).reduce<Record<string, v_2_5_0['Environment']>>(
    (acc, [key, environment]) => {
      acc[key] = {
        ...environment,
        uid: environment.uid as Environment['uid'],
      } satisfies v_2_5_0['Environment']
      return acc
    },
    {},
  )

  const requests = Object.entries(data.requests || {}).reduce<Record<string, v_2_5_0['Request']>>(
    (acc, [key, request]) => {
      acc[key] = {
        ...request,
        uid: request.uid as Operation['uid'],
        servers: request.servers as Operation['servers'],
        selectedServerUid: request.selectedServerUid as Operation['selectedServerUid'],
        examples: request.examples as Operation['examples'],
        selectedSecuritySchemeUids: request.selectedSecuritySchemeUids as Operation['selectedSecuritySchemeUids'],
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
        uid: example.uid as RequestExample['uid'],
        requestUid: example.requestUid as RequestExample['requestUid'],
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
        uid: securityScheme.uid as SecurityScheme['uid'],
      } satisfies v_2_5_0['SecurityScheme']
      return acc
    },
    {},
  )

  const servers = Object.entries(data.servers || {}).reduce<Record<string, v_2_5_0['Server']>>((acc, [key, server]) => {
    acc[key] = {
      ...server,
      uid: server.uid as Server['uid'],
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
          enum: variable.enum && variable.enum.length > 0 ? (variable.enum as [string, ...string[]]) : undefined,
          default: variable.default ?? '',
          description: variable.description,
        }
        return variablesAcc
      }, {}),
    }
    return acc
  }, {})

  const tags = Object.entries(data.tags || {}).reduce<Record<string, v_2_5_0['Tag']>>((acc, [key, tag]) => {
    acc[key] = {
      ...tag,
      uid: tag.uid as Tag['uid'],
      children: tag.children as Tag['children'],
    } satisfies v_2_5_0['Tag']
    return acc
  }, {})

  const workspaces = Object.entries(data.workspaces || {}).reduce<Record<string, v_2_5_0['Workspace']>>(
    (acc, [key, workspace]) => {
      acc[key] = {
        ...workspace,
        uid: workspace.uid as Workspace['uid'],
        collections: workspace.collections.map((uid) => uid as Collection['uid']),
        cookies: workspace.cookies.map((uid) => uid as Cookie['uid']),
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
