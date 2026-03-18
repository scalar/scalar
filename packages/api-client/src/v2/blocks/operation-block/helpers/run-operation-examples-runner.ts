import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { generateClientMutators } from '@scalar/workspace-store/mutators'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'

import { createVariablesStoreForRequest } from './create-variables-store-for-request'
import { executeOperationRequest } from './execute-operation-request'
import { getOperationRequestParams } from './get-operation-request-params'
import type { ResponseInstance } from './send-request'
import type { ClientLayout } from '@/v2/types/layout'

/** One item in the list of operation examples to run in sequence */
export type OperationExampleRunItem = {
  document: OpenApiDocument
  operation: OperationObject
  path: string
  method: HttpMethod
  exampleKey: string
  /** Document slug for auth and env (same as useOperationRequestContext documentSlug) */
  documentSlug: string
}

/** Shared context for the runner; per-operation context is derived via getOperationRequestParams (same as Operation). */
export type RunOperationExamplesContext = {
  workspaceStore: WorkspaceStore | null
  layout: ClientLayout
  plugins: ClientPlugin[]
  eventBus?: WorkspaceEventBus
}

/** Result for a single run in the sequence */
export type OperationExampleRunResult = {
  item: OperationExampleRunItem
  error: { message: string } | null
  result: {
    response: ResponseInstance
    request: Request
    timestamp: number
    originalResponse: Response
  } | null
}

/**
 * Runs a list of operation examples sequentially. Uses the same per-operation
 * context logic as useOperationRequestContext (getOperationRequestParams) so
 * each item gets the correct environment, server, auth, etc. for that operation.
 * Uses a single shared variables store so script-set variables propagate to the next request.
 *
 * @param items List of operation examples to run in order (each must include documentSlug)
 * @param context Shared context (workspaceStore, layout, plugins, eventBus)
 * @param onStep Optional callback after each run (e.g. for progress UI)
 * @returns Array of results in the same order as items
 */
export async function runOperationExamplesRunner(
  items: OperationExampleRunItem[],
  context: RunOperationExamplesContext,
  onStep?: (result: OperationExampleRunResult, index: number) => void,
): Promise<OperationExampleRunResult[]> {
  const { workspaceStore, layout, plugins, eventBus } = context

  if (items.length === 0) {
    return []
  }

  const firstItem = items[0]!
  const firstParams = getOperationRequestParams({
    workspaceStore,
    document: firstItem.document,
    path: firstItem.path,
    method: firstItem.method,
    documentSlug: firstItem.documentSlug,
    layout,
  })

  const variablesStore =
    workspaceStore && firstParams.activeEnvironment
      ? (() => {
          const mutators = generateClientMutators(workspaceStore)
          const documentEnv = mutators.active().environment
          const workspaceEnv = mutators.workspace().environment
          return createVariablesStoreForRequest({
            environment: firstParams.environment,
            activeEnvironmentName: firstParams.activeEnvironment,
            documentEnvironmentMutators: documentEnv,
            workspaceEnvironmentMutators: workspaceEnv,
            document: firstItem.document,
            workspace: workspaceStore.workspace ?? null,
          })
        })()
      : undefined

  const results: OperationExampleRunResult[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!
    const params = getOperationRequestParams({
      workspaceStore,
      document: item.document,
      path: item.path,
      method: item.method,
      documentSlug: item.documentSlug,
      layout,
    })

    const { error, result } = await executeOperationRequest({
      document: item.document,
      operation: item.operation,
      path: item.path,
      method: item.method,
      exampleKey: item.exampleKey,
      environment: params.environment,
      server: params.server,
      proxyUrl: params.proxyUrl,
      globalCookies: params.globalCookies,
      selectedSecuritySchemes: params.selectedSecuritySchemes,
      plugins,
      eventBus,
      variablesStore,
    })

    const runResult: OperationExampleRunResult = { item, error, result }
    results.push(runResult)
    onStep?.(runResult, i)
  }

  return results
}
