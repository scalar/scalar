import { reactive } from 'vue'

import { type DocumentAuth, DocumentAuthSchema, type SecretsAuth } from '@/entities/auth/schema'
import { safeAssign } from '@/helpers/general'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { coerceValue } from '@/schemas/typebox-coerce'

export type AuthStore = {
  getAuthSecrets: (documentName: string, schemeName: string) => SecretsAuth[string] | undefined
  setAuthSecrets: (documentName: string, schemeName: string, auth: SecretsAuth[string]) => void
  deleteAuthSecrets: (documentName: string, schemeName: string) => void
  load: (data: DocumentAuth) => void
  export: () => DocumentAuth
}

export const createAuthStore = (): AuthStore => {
  const auth = reactive<DocumentAuth>({})

  const getAuthSecrets: AuthStore['getAuthSecrets'] = (documentName, schemeName) => {
    return auth[documentName]?.secrets?.[schemeName]
  }

  const setAuthSecrets: AuthStore['setAuthSecrets'] = (documentName, schemeName, data) => {
    auth[documentName] ||= { secrets: {}, selected: { document: { selectedIndex: 0, selectedSchemes: [] }, path: {} } }
    auth[documentName].secrets[schemeName] = data
  }

  const deleteAuthSecrets: AuthStore['deleteAuthSecrets'] = (documentName, schemeName) => {
    delete auth[documentName]?.secrets?.[schemeName]
  }

  const load: AuthStore['load'] = (data) => {
    safeAssign(auth, coerceValue(DocumentAuthSchema, data))
  }

  const exportAuth: AuthStore['export'] = () => {
    return unpackProxyObject(auth)
  }

  return {
    getAuthSecrets,
    setAuthSecrets,
    deleteAuthSecrets,
    load,
    export: exportAuth,
  }
}
