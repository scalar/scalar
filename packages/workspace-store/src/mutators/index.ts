import type { WorkspaceStore } from '@/client'
import { cookieMutators } from '@/mutators/cookie'
import { environmentMutators } from '@/mutators/environment'
import { requestMutators } from '@/mutators/request'
import { requestExampleMutators } from '@/mutators/request-example'

export function generateClientMutators(store: WorkspaceStore) {
  const mutators = (documentName: string) => {
    return {
      requestExampleMutators: requestExampleMutators(store, documentName),
      requestMutators: requestMutators(store, documentName),
      environmentMutators: environmentMutators(store, documentName),
      cookieMutators: cookieMutators(store, documentName),
    }
  }

  return {
    active: () => mutators(store.workspace['x-scalar-active-document'] ?? Object.keys(store.workspace.documents)[0]),
    doc: (name: string) => mutators(name),
  }
}
