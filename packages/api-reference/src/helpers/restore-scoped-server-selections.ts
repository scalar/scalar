import { getOwnEntry } from '@scalar/helpers/object/get-own-entry'
import {
  forEachPathItemOperation,
  getPathItemOperation,
  getPathItemServerTarget,
} from '@scalar/workspace-store/helpers/for-each-path-item-operation'
import { getPathEntries } from '@scalar/workspace-store/helpers/get-path-entries'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { prepareServerSelection } from '@scalar/workspace-store/request-example'
import type {
  OpenApiDocument,
  OperationObject,
  PathItemObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

type ServerScope = Pick<OpenApiDocument, 'servers' | 'x-scalar-selected-server'>

/** Recovers an old selection only when the same authored template is still available. */
export const getRestoredServerSelection = (
  before: ServerScope | undefined,
  servers: ServerObject[] | undefined,
  options: Parameters<typeof prepareServerSelection>[1],
): string | undefined => {
  const selected = before?.['x-scalar-selected-server']
  if (selected === '') {
    return selected
  }
  if (!before || selected == null) {
    return undefined
  }

  const previousServer = prepareServerSelection(before, options)
  if (!previousServer) {
    return undefined
  }

  // The previous list can recover a legacy key. The new list must contain the same authored template.
  const key = previousServer.url
  if (
    servers?.some((server) => {
      const resolved = getResolvedRef(server)
      return resolved?.url === key
    })
  ) {
    return key
  }

  // A legacy absolute key may survive the change from collapsed to authored relative slashes.
  if (selected !== key && key.startsWith('/')) {
    const migratedServer = prepareServerSelection({ servers, 'x-scalar-selected-server': selected }, options)
    const migratedKey = migratedServer?.url
    if (migratedKey?.startsWith('/')) {
      return migratedKey
    }
  }
  return undefined
}

/** Carries user selections into the reloaded client document when the server still exists in the same scope. */
export const restoreScopedServerSelections = (
  previous: OpenApiDocument,
  current: OpenApiDocument,
  baseServerUrl?: string,
): void => {
  const previousOptions = { baseServerUrl, documentUrl: previous['x-scalar-original-source-url'] }
  const restore = (
    before: PathItemObject | OperationObject | undefined,
    after: PathItemObject | OperationObject | undefined,
  ): void => {
    if (before?.servers == null || after?.servers == null) {
      return
    }

    if (before['x-scalar-selected-server'] != null) {
      // An unavailable saved choice falls back to the first server in this scope.
      after['x-scalar-selected-server'] = getRestoredServerSelection(before, after.servers, previousOptions)
    }
  }

  const restorePaths = (before: OpenApiDocument['paths'], after: OpenApiDocument['paths']): void => {
    for (const [path, pathItem] of getPathEntries(after)) {
      const previousPathItem = getOwnEntry(before, path)
      if (!previousPathItem) {
        continue
      }
      restore(getPathItemServerTarget(previousPathItem), getPathItemServerTarget(pathItem))
      forEachPathItemOperation(pathItem, (method, operation) => {
        restore(getResolvedRef(getPathItemOperation(previousPathItem, method)), getResolvedRef(operation))
      })
    }
  }

  restorePaths(previous.paths, current.paths)
  restorePaths(previous.webhooks, current.webhooks)
}
