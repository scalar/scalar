import type { AuthStore } from '@scalar/workspace-store/entities/auth/index'
import type { SecretsAuth } from '@scalar/workspace-store/entities/auth/schema'

export const getSecrets = <Type extends SecretsAuth[string]['type']>({
  schemeName,
  authStore,
  documentSlug,
  type,
}: {
  schemeName: string
  type: Type
  authStore: AuthStore
  documentSlug: string
}): (SecretsAuth[string] & { type: Type }) | undefined => {
  const secret = authStore.getAuthSecrets(documentSlug, schemeName)
  if (secret?.type !== type) {
    return undefined
  }

  return secret as (SecretsAuth[string] & { type: Type }) | undefined
}

export const getFlowsSecretToken = ({
  schemeName,
  authStore,
  documentSlug,
}: {
  schemeName: string
  authStore: AuthStore
  documentSlug: string
}): string[] => {
  const secret = authStore.getAuthSecrets(documentSlug, schemeName)
  if (secret?.type !== 'oauth2') {
    return []
  }

  return [
    secret?.authorizationCode?.['x-scalar-secret-token'],
    secret?.implicit?.['x-scalar-secret-token'],
    secret?.clientCredentials?.['x-scalar-secret-token'],
    secret?.password?.['x-scalar-secret-token'],
  ].filter((it) => it !== undefined)
}
