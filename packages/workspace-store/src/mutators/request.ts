import type { WorkspaceStore } from '@/client'
import { getDocument } from '@/mutators/helpers'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'

export type OperationIdentifier = {
  path: string
  method: Exclude<HttpMethod, 'connect' | 'head' | 'options'>
}

export const requestMutators = (store: WorkspaceStore, documentName: string) => {
  const document = getDocument(store, documentName)

  const deleteRequest = ({ path, method }: OperationIdentifier) => {
    if (!document) {
      return
    }

    const pathObject = document?.paths?.[path]

    if (!pathObject) {
      return
    }

    const operation = pathObject[method]

    if (!operation) {
      return
    }

    // Delete the request by slug
    delete pathObject[method]
  }

  return {
    deleteRequest,
  }
}
