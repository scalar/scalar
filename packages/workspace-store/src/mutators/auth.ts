import type { HttpMethod } from '@scalar/helpers/http/http-methods'

import { generateUniqueValue } from '@/helpers/generate-unique-value'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { WorkspaceDocument } from '@/schemas'
import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'
import type { SecuritySchemeObject } from '@/schemas/v3.1/strict/security-scheme'

export type AuthMeta =
  | {
      type: 'document'
    }
  | {
      type: 'operation'
      path: string
      method: string
    }

export const updateSelectedSecuritySchemes = ({
  document,
  selectedSecuritySchemes,
  create,
  meta,
}: {
  document: WorkspaceDocument | null
  selectedSecuritySchemes: SecurityRequirementObject[]
  create: { name: string; scheme: SecuritySchemeObject }[]
  meta: AuthMeta
}) => {
  if (!document) {
    return
  }

  const getTarget = () => {
    if (meta.type === 'document') {
      return document
    }

    return getResolvedRef(document.paths?.[meta.path]?.[meta.method as HttpMethod])
  }

  // We first need to create the new security schemes that are provided
  const newSchemes = create
    .map((scheme) => {
      const name = generateUniqueValue({
        defaultValue: scheme.name,
        validation: (value) => !document.components?.securitySchemes?.[value],
        maxRetries: 100,
      })

      if (!name) {
        return
      }

      // Add the new security scheme to the document
      if (!document.components) {
        document.components = {}
      }
      if (!document.components.securitySchemes) {
        document.components.securitySchemes = {}
      }

      document.components.securitySchemes[name] = scheme.scheme

      return {
        [name]: [],
      }
    })
    .filter(Boolean) as SecurityRequirementObject[]

  const target = getTarget()

  const newSelectedSecuritySchemes = [...selectedSecuritySchemes, ...newSchemes]

  // If the target is not found, return
  if (!target) {
    return
  }

  if (!target['x-scalar-selected-security']) {
    target['x-scalar-selected-security'] = {
      'x-selected-index': -1,
      'x-schemes': [],
    }
  }

  const selectedIndex = target['x-scalar-selected-security']['x-selected-index']

  target['x-scalar-selected-security']['x-schemes'] = newSelectedSecuritySchemes

  // Adjust selected index if needed
  if (newSelectedSecuritySchemes.length > 0 && selectedIndex < 0) {
    target['x-scalar-selected-security']['x-selected-index'] = 0
  }

  // if the selected index is out of bounds, reset it to the last item
  if (selectedIndex >= newSelectedSecuritySchemes.length) {
    target['x-scalar-selected-security']['x-selected-index'] = newSelectedSecuritySchemes.length - 1
  }
}

export type SecuritySchemeUpdate =
  | {
      type: 'http'
      payload: Partial<{
        token: string
        username: string
        password: string
      }>
    }
  | {
      type: 'apiKey'
      payload: Partial<{
        name: string
        value: string
      }>
    }
  | {
      type: 'oauth2'
      flow: 'implicit' | 'password' | 'clientCredentials' | 'authorizationCode'
      payload: Partial<{
        authUrl: string
        tokenUrl: string
        token: string
        redirectUrl: string
        clientId: string
        clientSecret: string
        usePkce: 'no' | 'SHA-256' | 'plain'
        username: string
        password: string
      }>
    }

export const updateSecurityScheme = ({
  document,
  data,
  name,
}: {
  document: WorkspaceDocument | null
  data: SecuritySchemeUpdate
  name: string
}) => {
  if (!document) {
    return
  }

  const target = getResolvedRef(document.components?.securitySchemes?.[name])

  if (!target) {
    return
  }

  if (target.type === 'http' && data.type === 'http') {
    if (data.payload.username) {
      target['x-scalar-secret-username'] = data.payload.username
    }
    if (data.payload.password) {
      target['x-scalar-secret-password'] = data.payload.password
    }
    if (data.payload.token) {
      target['x-scalar-secret-token'] = data.payload.token
    }
  } else if (target.type === 'apiKey' && data.type === 'apiKey') {
    if (data.payload.name) {
      target.name = data.payload.name
    }
    if (data.payload.value) {
      target['x-scalar-secret-token'] = data.payload.value
    }
  } else if (target.type === 'oauth2' && data.type === 'oauth2') {
    const flow = target.flows[data.flow]
    if (!flow) {
      return
    }

    if (data.payload.authUrl && 'authorizationUrl' in flow) {
      flow.authorizationUrl = data.payload.authUrl
    }
    if (data.payload.tokenUrl && 'tokenUrl' in flow) {
      flow.tokenUrl = data.payload.tokenUrl
    }
    if (data.payload.token && 'token' in flow) {
      flow.token = data.payload.token
    }
    if (data.payload.redirectUrl && 'redirectUrl' in flow) {
      flow.redirectUrl = data.payload.redirectUrl
    }
    if (data.payload.clientId && 'clientId' in flow) {
      flow['x-scalar-secret-client-id'] = data.payload.clientId
    }
    if (data.payload.clientSecret && 'x-scalar-secret-client-secret' in flow) {
      flow['x-scalar-secret-client-secret'] = data.payload.clientSecret
    }
    if (data.payload.usePkce && 'usePkce' in flow) {
      flow.usePkce = data.payload.usePkce
    }
    if (data.payload.username && 'username' in flow) {
      flow.username = data.payload.username
    }
    if (data.payload.password && 'password' in flow) {
      flow.password = data.payload.password
    }
  }

  // TODO: handle openid connect type in the future

  return
}

export const updateSelectedAuthTab = ({
  document,
  index,
  meta,
}: {
  document: WorkspaceDocument | null
  index: number
  meta: AuthMeta
}) => {
  if (!document) {
    return
  }

  const getTarget = () => {
    if (meta.type === 'document') {
      return document
    }

    return getResolvedRef(document.paths?.[meta.path]?.[meta.method as HttpMethod])
  }

  const target = getTarget()

  if (!target) {
    return
  }

  if (!target['x-scalar-selected-security']) {
    target['x-scalar-selected-security'] = {
      'x-selected-index': 0,
      'x-schemes': [],
    }
  }

  target['x-scalar-selected-security']['x-selected-index'] = index
}

export const updateSelectedScopes = ({
  document,
  id,
  name,
  scopes,
  meta,
}: {
  document: WorkspaceDocument | null
  id: string[]
  name: string
  scopes: string[]
  meta: AuthMeta
}) => {
  if (!document) {
    return
  }

  const getTarget = () => {
    if (meta.type === 'document') {
      return document
    }

    return getResolvedRef(document.paths?.[meta.path]?.[meta.method as HttpMethod])
  }

  const target = getTarget()

  if (!target) {
    return
  }

  const selectedSchemes = target['x-scalar-selected-security']?.['x-schemes']

  if (!selectedSchemes) {
    return
  }

  const scheme = selectedSchemes.find((scheme) => JSON.stringify(Object.keys(scheme)) === JSON.stringify(id))

  if (!scheme) {
    return
  }

  scheme[name] = scopes
}

export const deleteSecurityScheme = ({ document, names }: { document: WorkspaceDocument | null; names: string[] }) => {
  if (!document) {
    return
  }

  const target = getResolvedRef(document.components?.securitySchemes)

  if (!target) {
    return
  }

  names.forEach((name) => {
    delete target[name]
  })

  const selectedSchemes = document['x-scalar-selected-security']?.['x-schemes']

  if (!selectedSchemes) {
    return
  }

  const filterSecuritySchemes = (schemes: SecurityRequirementObject[]) => {
    return schemes.filter((scheme) => !names.some((name) => Object.keys(scheme).includes(name)))
  }

  // Filter document level
  if (document['x-scalar-selected-security']) {
    document['x-scalar-selected-security']['x-schemes'] = filterSecuritySchemes(
      document['x-scalar-selected-security']['x-schemes'],
    )
  }

  if (document['security']) {
    document['security'] = filterSecuritySchemes(document['security'])
  }

  // traverse through the paths and filter the security schemes
  Object.values(document.paths ?? {}).forEach((path) => {
    Object.values(path).forEach((operation) => {
      if (typeof operation !== 'object') {
        return
      }

      const resolvedOperation = getResolvedRef(operation)

      if ('security' in resolvedOperation && resolvedOperation['security']) {
        resolvedOperation['security'] = filterSecuritySchemes(resolvedOperation['security'])
      }

      if ('x-scalar-selected-security' in resolvedOperation && resolvedOperation['x-scalar-selected-security']) {
        resolvedOperation['x-scalar-selected-security']['x-schemes'] = filterSecuritySchemes(
          resolvedOperation['x-scalar-selected-security']['x-schemes'],
        )
      }
    })
  })
}
