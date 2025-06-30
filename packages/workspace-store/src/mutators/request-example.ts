import type { WorkspaceStore } from '@/client'
import { getDocument } from '@/mutators/helpers'
import type { OperationIdentifier } from '@/mutators/request'
import type { XScalarClientConfigRequestExample } from '@/schemas/v3.1/strict/client-config-extensions/x-scalar-client-config-request-example'
import { isReference } from '@/schemas/v3.1/type-guard'

export const requestExampleMutators = (store: WorkspaceStore, documentName: string) => {
  const document = getDocument(store, documentName)

  const addRequestExample = ({
    path,
    method,
    slug,
    request,
  }: OperationIdentifier & { slug: string; request: XScalarClientConfigRequestExample }) => {
    if (!document) {
      return
    }

    const pathObject = document?.paths?.[path]

    if (!pathObject) {
      return
    }

    const operation = pathObject[method]

    if (!operation || isReference(operation)) {
      return
    }

    // Create a new request example if it doesn't exist
    if (!operation['x-scalar-client-config-request-example']) {
      operation['x-scalar-client-config-request-example'] = {}
    }

    operation['x-scalar-client-config-request-example'][slug] = request
  }

  const deleteRequestExample = ({ path, method, slug }: OperationIdentifier & { slug: string }) => {
    if (!document) {
      return
    }

    const pathObject = document?.paths?.[path]

    if (!pathObject) {
      return
    }

    const operation = pathObject[method]

    if (!operation || isReference(operation)) {
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
