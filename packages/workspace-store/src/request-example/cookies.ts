import type { WorkspaceStore } from '@/client'
import type { WorkspaceDocument } from '@/schemas'
import type { XScalarCookie } from '@/schemas/extensions/general/x-scalar-cookies'

export type ExtendedScalarCookie = XScalarCookie & {
  location: 'workspace' | 'document' | 'operation'
}

export const getGlobalCookies = (
  workspace: WorkspaceStore | null,
  document: WorkspaceDocument | null,
): ExtendedScalarCookie[] => {
  return [
    ...((workspace?.workspace?.['x-scalar-cookies'] ?? []).map((it) => ({
      ...it,
      location: 'workspace',
    })) satisfies ExtendedScalarCookie[]),
    ...((document?.['x-scalar-cookies'] ?? []).map((it) => ({
      ...it,
      location: 'document',
    })) satisfies ExtendedScalarCookie[]),
  ]
}
