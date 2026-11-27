import { forEachPathItemOperation, getPathItemServerTarget } from '@/helpers/for-each-path-item-operation'
import { getPathEntries } from '@/helpers/get-path-entries'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { prepareServerSelection } from '@/request-example/context/servers'
import type { OpenApiDocument } from '@/schemas/v3.2/strict/openapi-document'

type ServerScope = Pick<OpenApiDocument, 'servers' | 'x-scalar-selected-server'>

/** Normalizes legacy URL keys when a persisted OpenAPI document is loaded. */
export const migrateServerSelections = (document: OpenApiDocument): void => {
  const options = { documentUrl: document['x-scalar-original-source-url'] }
  const migrate = (scope: ServerScope | undefined): void => {
    const key = scope?.['x-scalar-selected-server']
    if (!scope || !key || scope.servers?.some((server) => getResolvedRef(server)?.url === key)) {
      return
    }
    const selected = prepareServerSelection(scope, options)
    if (selected) {
      scope['x-scalar-selected-server'] = selected.url
    }
  }

  migrate(document)
  for (const paths of [document.paths, document.webhooks]) {
    for (const [, pathItem] of getPathEntries(paths)) {
      migrate(getPathItemServerTarget(pathItem))
      forEachPathItemOperation(pathItem, (_method, operation) => migrate(getResolvedRef(operation)))
    }
  }
}
