import type { WorkspaceStore } from '@/client'
import type { XScalarClientConfigRequestExample } from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-request-example'
import { isReference } from '@/schemas/v3.1/type-guard'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'

type OperationIdentifier = {
  path: string
  method: Exclude<HttpMethod, 'connect' | 'head' | 'options'>
}

const requestExampleMutators = (store: WorkspaceStore, documentName: string) => {
  const getOperation = ({ path, method }: OperationIdentifier) => {
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

  const addRequestExample = ({
    path,
    method,
    slug,
    request,
  }: OperationIdentifier & { slug: string; request: XScalarClientConfigRequestExample }) => {
    const operation = getOperation({ path, method })

    if (!operation) {
      return
    }

    if (!operation['x-scalar-client-config-request-example']) {
      operation['x-scalar-client-config-request-example'] = {}
    }

    operation['x-scalar-client-config-request-example'][slug] = request
  }

  const deleteRequestExample = ({ path, method, slug }: OperationIdentifier & { slug: string }) => {
    const operation = getOperation({ path, method })

    if (!operation) {
      return
    }

    if (!operation['x-scalar-client-config-request-example']) {
      return
    }

    // Delete the request example by slug
    delete operation['x-scalar-client-config-request-example'][slug]
  }

  return {
    addRequestExample,
    deleteRequestExample,
  }
}

export function generateClientMutators(store: WorkspaceStore) {
  const mutators = (documentName: string) => {
    return {
      requestExampleMutators: requestExampleMutators(store, documentName),
    }
  }

  return {
    active: () => mutators(store.workspace['x-scalar-active-document'] ?? Object.keys(store.workspace.documents)[0]),
    doc: (name: string) => mutators(name),
  }
}
