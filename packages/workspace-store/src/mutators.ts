import type { WorkspaceStore } from '@/client'
import { isReference } from '@/schemas/v3.1/type-guard'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'

type RequestIdentifier = {
  path: string
  method: Exclude<HttpMethod, 'connect' | 'head' | 'options'>
}

const requestMutators = (store: WorkspaceStore, documentName: string) => {
  const getOperation = ({ path, method }: RequestIdentifier) => {
    const document = store.workspace.documents[documentName]

    if (!document) {
      console.error(`Document ${documentName} not found in workspace`)
      return
    }

    const operation = document.paths?.[path]?.[method]

    if (!operation) {
      console.error(`Operation ${method.toUpperCase()} ${path} not found in document ${documentName}`)
      return
    }

    if (isReference(operation)) {
      console.error(`Operation ${method.toUpperCase()} ${path} is a reference and cannot be added directly`)
      return
    }

    return operation
  }

  const addRequest = ({ path, method }: RequestIdentifier) => {
    const operation = getOperation({ path, method })

    // TODO: Implement the logic to add the request to the store
    operation?.summary
  }

  const deleteRequest = ({ path, method }: RequestIdentifier) => {
    const operation = getOperation({ path, method })

    // TODO: implement the logic to delete the request from the store
    operation?.summary
  }

  return {
    addRequest,
    deleteRequest,
  }
}

export function generateClientMutators(store: WorkspaceStore) {
  const mutators = (documentName: string) => {
    return {
      requestMutators: requestMutators(store, documentName),
    }
  }

  return {
    active: () => mutators(store.workspace['x-scalar-active-document'] ?? Object.keys(store.workspace.documents)[0]),
    doc: (name: string) => mutators(name),
  }
}
