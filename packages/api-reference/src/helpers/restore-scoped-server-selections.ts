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
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Carries user selections into the reloaded client document when the server still exists in the same scope. */
export const restoreScopedServerSelections = (
  previous: OpenApiDocument,
  current: OpenApiDocument,
  baseServerUrl?: string,
): void => {
  const options = { baseServerUrl, documentUrl: current['x-scalar-original-source-url'] }
  const restore = (
    before: PathItemObject | OperationObject | undefined,
    after: PathItemObject | OperationObject | undefined,
  ): void => {
    const selected = before?.['x-scalar-selected-server']
    if (before?.servers == null || after?.servers == null || selected == null) {
      return
    }
    const url =
      selected === ''
        ? ''
        : prepareServerSelection({ servers: after.servers, 'x-scalar-selected-server': selected }, options)?.url
    if (url != null) {
      after['x-scalar-selected-server'] = url
    }
  }

  const restorePaths = (before: OpenApiDocument['paths'], after: OpenApiDocument['paths']): void => {
    for (const [path, pathItem] of getPathEntries(after)) {
      const previousPathItem = before?.[path]
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
