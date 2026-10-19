import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { getAsyncApiSecurityRequirements, getAsyncApiSecuritySchemes } from '@scalar/workspace-store/channel-example'
import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import {
  type MergedSecuritySchemes,
  type SecuritySchemeObjectSecret,
  getSecuritySchemes,
  getSelectedSecurity,
  mergeSecurity,
} from '@scalar/workspace-store/request-example'

import type { getAsyncApiExampleContext } from './get-asyncapi-example-context'

/** Resolve only connection credentials allowed by the selected server. */
export const getAsyncApiExampleSecurity = (
  document: AsyncApiDocument,
  context: ReturnType<typeof getAsyncApiExampleContext>,
  authStore?: AuthStore,
  securitySchemes?: MergedSecuritySchemes,
): SecuritySchemeObjectSecret[] => {
  if (!context?.server || !authStore) {
    return []
  }
  const documentName: string = document['x-scalar-navigation']?.name ?? ''
  const schemes =
    securitySchemes ??
    mergeSecurity(getAsyncApiSecuritySchemes(document, { operations: {} }), {}, authStore, documentName)
  const requirements = getAsyncApiSecurityRequirements(document, null, context.server.server, {
    serverName: context.server.name,
  })
  const selected = getSelectedSecurity(
    authStore.getAuthSelectedSchemas({ type: 'document', documentName }),
    context.channelName
      ? authStore.getAuthSelectedSchemas({ type: 'operation', documentName, path: context.channelName, method: 'get' })
      : undefined,
    requirements,
    schemes,
  )
  if (selected.selectedIndex < 0) {
    return []
  }
  const requested = selected.selectedSchemes[selected.selectedIndex] ?? {}
  const names = Object.keys(requested)
  const requirement =
    requirements.find(
      (candidate) =>
        Object.keys(candidate).length === names.length && names.every((name) => Object.hasOwn(candidate, name)),
    ) ?? {}
  return getSecuritySchemes(schemes, requirement).filter(
    (scheme) => scheme.type === 'apiKey' && (scheme.in === 'query' || scheme.in === 'cookie'),
  )
}
