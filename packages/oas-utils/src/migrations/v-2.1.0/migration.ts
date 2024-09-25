import { camelToTitleWords, capitalize } from '@/helpers'
import { parseLocalStorage } from '@/migrations/local-storage'
import type { v_0_0_0 } from '@/migrations/v-0.0.0/types.generated'

import type { v_2_1_0 } from './types.generated'

/** V-0.0.0 to V-2.1.0 migration */
export const migrate_v_2_1_0 = (data: Omit<v_0_0_0.Data, 'folders'>) => {
  console.info('Performing data migration v-0.0.0 to v-2.1.0')

  // Augment the previous data
  const oldData = {
    ...data,
    // @ts-expect-error Tags used to be called folders
    folders: parseLocalStorage('folder'),
  } as v_0_0_0.Data

  /** To grab requests and tags we must traverse children, also for security */
  const flattenChildren = (childUids: string[]) =>
    childUids.reduce(
      (prev, uid) => {
        const request = oldData.requests[uid]

        // Request
        if (request) {
          prev.requestUids.add(uid)
          // Security
          request.securitySchemeUids?.forEach((s) => prev.authUids.add(s))
        }

        // Folder -> tag
        else if (oldData.folders[uid]) {
          const { requestUids, tagUids, authUids } = flattenChildren(
            oldData.folders[uid].childUids ?? [],
          )
          prev.tagUids.add(uid)
          requestUids.forEach((r) => prev.requestUids.add(r))
          tagUids.forEach((t) => prev.tagUids.add(t))
          authUids.forEach((a) => prev.authUids.add(a))
        }

        return prev
      },
      {
        requestUids: new Set<string>(),
        tagUids: new Set<string>(),
        authUids: new Set<string>(),
      },
    )

  /** Migrate values from old securitySchemes to the new auth */
  const migrateAuth = (
    scheme: v_0_0_0.SecurityScheme,
  ): v_2_1_0.Collection['auth'][string] => {
    if (scheme.type === 'apiKey')
      // ApiKey
      return { type: 'apiKey', name: scheme.name, value: scheme.value ?? '' }

    // HTTP
    if (scheme.type === 'http')
      return {
        type: 'http',
        username: scheme.value ?? '',
        password: scheme.secondValue ?? '',
        token: scheme.value ?? '',
      }

    // Oauth2 Implicit
    if (scheme.type === 'oauth2' && scheme.flow.type === 'implicit')
      return {
        type: 'oauth-implicit',
        token: scheme.flow.token ?? '',
      }

    // Oauth2 Password
    if (scheme.type === 'oauth2' && scheme.flow.type === 'password')
      return {
        type: 'oauth-password',
        token: scheme.flow.token ?? '',
        username: scheme.flow.value ?? '',
        password: scheme.flow.secondValue ?? '',
        clientSecret: scheme.flow.clientSecret ?? '',
      }

    // Oauth2 clientCredentials
    if (scheme.type === 'oauth2' && scheme.flow.type === 'clientCredentials')
      return {
        type: 'oauth-clientCredentials',
        token: scheme.flow.token ?? '',
        clientSecret: scheme.flow.clientSecret ?? '',
      }

    // Oauth2 Authorization Code
    if (scheme.type === 'oauth2' && scheme.flow.type === 'authorizationCode')
      return {
        type: 'oauth-authorizationCode',
        token: scheme.flow.token ?? '',
        clientSecret: scheme.flow.clientSecret ?? '',
      }

    // Default - should not get hit
    return {
      type: 'apiKey',
      name: '',
      value: '',
    }
  }

  /** This is needed due to our previous data being poluted, we will only allow auth on a requst which is in the spec */
  const requestSecurityDict: Record<string, string[]> = {}

  // Collections
  const collections = Object.values(oldData.collections ?? {}).map((c) => {
    const { requestUids, tagUids, authUids } = flattenChildren(
      c.childUids ?? [],
    )

    // Ensure we got unique uids
    const securitySchemesSet = new Set([
      ...authUids,
      ...Object.values(c.securitySchemeDict ?? {}),
    ])
    const securitySchemes = [...securitySchemesSet]

    // Add this auth to each request
    requestUids.forEach((r) => (requestSecurityDict[r] = securitySchemes))

    // Migrate auth
    const auth = securitySchemes.reduce(
      (prev, uid) => {
        const scheme = oldData.securitySchemes[uid]
        if (scheme.uid) prev[uid] = migrateAuth(scheme)
        return prev
      },
      {} as v_2_1_0.Collection['auth'],
    )

    return {
      'type': 'collection',
      'openapi': c.spec?.openapi || '3.1.0',
      'info': c.spec?.info || { title: 'OpenAPI Spec', version: '0.0.1' },
      'security': c.spec?.security || [],
      'externalDocs': c.spec?.externalDocs,
      'uid': c.uid,
      securitySchemes,
      'selectedServerUid': c.selectedServerUid || c.spec?.serverUids?.[0] || '',
      'servers': c.spec?.serverUids || [],
      'requests': [...requestUids],
      'tags': [...tagUids],
      auth,
      'children': c.childUids || [],
      'x-scalar-icon': 'interface-content-folder',
      'liveSync': false,
    } satisfies v_2_1_0.Collection
  })

  // Cookies
  const cookies = Object.values(
    oldData.cookies ?? {},
  ) satisfies v_2_1_0.Cookie[]

  // Environments
  const environments = Object.values(oldData.environments ?? {}).map(
    (e) =>
      ({
        ...e,
        value: e.raw ?? '',
      }) satisfies v_2_1_0.Environment,
  )

  // Requests
  const requests = Object.values(oldData.requests ?? {}).map((r) => {
    // Convert parameters
    const parameters: v_2_1_0.Request['parameters'] = [
      ...Object.values(r.parameters?.path ?? {}),
      ...Object.values(r.parameters?.query ?? {}),
      ...Object.values(r.parameters?.headers ?? {}),
      ...Object.values(r.parameters?.cookies ?? {}),
    ].filter((p) => p)

    // Ensure this request can access these schemes
    const selectedSecuritySchemeUids = (
      r.selectedSecuritySchemeUids || []
    ).filter((s) => requestSecurityDict[r.uid].includes(s))

    return {
      ...r,
      parameters,
      type: 'request',
      method: (r.method?.toLowerCase() as v_2_1_0.Request['method']) ?? 'get',
      examples: r.childUids || [],
      selectedSecuritySchemeUids,
      selectedServerUid: '',
      servers: [],
    } satisfies v_2_1_0.Request
  })

  // Request Examples
  const requestExamples = Object.values(oldData.requestExamples ?? {}).map(
    (e) =>
      ({
        ...e,
        type: 'requestExample',
      }) satisfies v_2_1_0.RequestExample,
  )

  type Oauth2 = Exclude<
    v_2_1_0.SecurityScheme,
    { type: 'http' } | { type: 'apiKey' } | { type: 'openIdConnect' }
  >

  /** Specifically handle each oauth2 flow */
  const migrateFlow = (flow: v_0_0_0.Flow): Oauth2['flow'] => {
    const base = {
      refreshUrl: flow.refreshUrl || '',
      selectedScopes: flow.selectedScopes || [],
      scopes: flow.scopes || {},
    } as const

    if (flow.type === 'implicit')
      return {
        ...flow,
        ...base,
        'type': 'implicit',
        'x-scalar-redirect-uri':
          ('redirectUri' in flow ? flow.redirectUri : '') || '',
      }
    if (flow.type === 'password')
      return {
        ...flow,
        ...base,
        tokenUrl: flow.tokenUrl || '',
      }
    if (flow.type === 'clientCredentials')
      return {
        ...flow,
        ...base,
        tokenUrl: flow.tokenUrl || '',
      }
    return {
      ...flow,
      ...base,
      'x-scalar-redirect-uri':
        ('redirectUri' in flow ? flow.redirectUri : '') || '',
      'authorizationUrl': flow.authorizationUrl || '',
      'tokenUrl': flow.tokenUrl || '',
    }
  }

  /** Generate a nameKey based on the type of oauth */
  const getNameKey = (scheme: v_0_0_0.SecurityScheme) => {
    switch (scheme?.type) {
      case 'apiKey':
        return `${capitalize(scheme.in)}`
      case 'http': {
        return `${capitalize(scheme.scheme)} Authentication`
      }
      case 'oauth2':
        return camelToTitleWords(scheme.flow.type)
      case 'openIdConnect':
        return `Open ID Connect`
      default:
        return 'None'
    }
  }

  // Security Schemes
  const securitySchemes = Object.values(oldData.securitySchemes ?? {}).map(
    (s) =>
      s.type === 'oauth2'
        ? ({
            ...s,
            'nameKey': getNameKey(s),
            'x-scalar-client-id': s.clientId || '',
            'flow': migrateFlow(s.flow),
          } satisfies Oauth2)
        : ({ ...s, nameKey: getNameKey(s) } satisfies Exclude<
            v_2_1_0.SecurityScheme,
            { type: 'oauth2' }
          >),
  )

  // Servers
  const servers = Object.values(oldData.servers ?? {}).map(
    (s) =>
      ({
        ...s,
        variables: s.variables ?? {},
      }) satisfies v_2_1_0.Server,
  )

  // Tags
  const tags = Object.values(oldData.folders ?? {}).map(
    (f) =>
      ({
        'type': 'tag',
        'uid': f.uid,
        'name': f.name || 'unknownTag',
        'description': f.description,
        'children': f.childUids || [],
        'x-scalar-children': [],
      }) satisfies v_2_1_0.Tag,
  )

  // Workspaces
  const workspaces = Object.values(oldData.workspaces ?? {}).map(
    (w) =>
      ({
        ...w,
        description: w.description ?? 'Basic Scalar Workspace',
        cookies: w.cookieUids || [],
        collections: w.collectionUids || [],
        environments: w.environmentUids || [],
      }) satisfies v_2_1_0.Workspace,
  )

  return {
    collections,
    cookies,
    environments,
    requestExamples,
    requests,
    securitySchemes,
    servers,
    tags,
    workspaces,
  }
}
