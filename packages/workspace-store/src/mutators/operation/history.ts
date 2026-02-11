import type { WorkspaceStore } from '@/client'
import type { HooksEvents } from '@/events/definitions/hooks'
import type { OperationEvents } from '@/events/definitions/operation'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { WorkspaceDocument } from '@/schemas'
import { isContentTypeParameterObject } from '@/schemas/v3.1/strict/type-guards'

import { fetchRequestToHar } from './helpers/fetch-request-to-har'
import { fetchResponseToHar } from './helpers/fetch-response-to-har'
import { harToOperation } from './helpers/har-to-operation'

export const addResponseToHistory = async (
  store: WorkspaceStore | null,
  document: WorkspaceDocument | null,
  { payload, meta }: HooksEvents['hooks:on:request:complete'],
) => {
  const documentName = document?.['x-scalar-navigation']?.name
  if (!document || !documentName || !payload) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    return
  }

  const operationParameters = operation.parameters ?? []

  // Get all the variables from the operation parameters
  const variables = operationParameters.reduce<Record<string, string>>((acc, param) => {
    const resolvedParam = getResolvedRef(param)
    if (isContentTypeParameterObject(resolvedParam)) {
      return acc
    }
    if (resolvedParam.in === 'path') {
      acc[resolvedParam.name] = getResolvedRef(resolvedParam.examples?.[meta.exampleKey])?.value ?? ''
    }
    return acc
  }, {})

  const requestHar = await fetchRequestToHar({ request: payload.request })
  const responseHar = await fetchResponseToHar({ response: payload.response })

  store?.history.addHistory(documentName, meta.path, meta.method, {
    response: responseHar,
    request: requestHar,
    meta: {
      example: meta.exampleKey,
    },
    time: payload.duration,
    timestamp: payload.timestamp,
    requestMetadata: {
      variables,
    },
  })
}

export const reloadOperationHistory = (
  store: WorkspaceStore | null,
  document: WorkspaceDocument | null,
  { meta, index, callback }: OperationEvents['operation:reload:history'],
) => {
  if (!document) {
    console.error('Document not found', meta.path, meta.method)
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    console.error('Operation not found', meta.path, meta.method)
    return
  }

  const historyItem = store?.history.getHistory(document['x-scalar-navigation']?.name ?? '', meta.path, meta.method)?.[
    index
  ]
  if (!historyItem) {
    console.error('History item not found', index)
    return
  }

  harToOperation({
    harRequest: historyItem.request,
    exampleKey: 'draft',
    baseOperation: operation,
    pathVariables: historyItem.requestMetadata.variables,
  })
  callback('success')
}
