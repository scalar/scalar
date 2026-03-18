import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { generateClientMutators } from '@scalar/workspace-store/mutators'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { OpenApiDocument, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'

import type { SecuritySchemeObjectSecret } from '@/v2/blocks/scalar-auth-selector-block/helpers/secret-types'

import { createVariablesStoreForRequest } from './create-variables-store-for-request'
import { executeOperationRequest } from './execute-operation-request'
import type { ResponseInstance } from './send-request'

/** One item in the list of operation examples to run in sequence */
export type OperationExampleRunItem = {
  document: OpenApiDocument
  operation: OperationObject
  path: string
  method: HttpMethod
  exampleKey: string
  /** Selected security schemes for this operation */
  selectedSecuritySchemes: SecuritySchemeObjectSecret[]
}

/** Shared context for all runs in the sequence (document, server, env, etc.) */
export type RunOperationExamplesContext = {
  environment: XScalarEnvironment
  server: ServerObject | null
  proxyUrl: string
  globalCookies: XScalarCookie[]
  plugins: ClientPlugin[]
  eventBus?: WorkspaceEventBus
  workspaceStore: WorkspaceStore | null
  activeEnvironmentName: string | undefined
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
 * Runs a list of operation examples sequentially. Uses a single shared variables
 * store so that pre-request and post-response scripts can set local variables
 * (pm.variables.set) and the next request in the sequence sees them.
 *
 * @param items List of operation examples to run in order
 * @param context Shared context (env, server, plugins, etc.)
 * @param onStep Optional callback after each run (e.g. for progress UI)
 * @returns Array of results in the same order as items
 */
export async function runOperationExamplesRunner(
  items: OperationExampleRunItem[],
  context: RunOperationExamplesContext,
  onStep?: (result: OperationExampleRunResult, index: number) => void,
): Promise<OperationExampleRunResult[]> {
  const {
    environment,
    server,
    proxyUrl,
    globalCookies,
    plugins,
    eventBus,
    workspaceStore,
    activeEnvironmentName,
  } = context

  if (items.length === 0) {
    return []
  }

  const variablesStore =
    workspaceStore && activeEnvironmentName
      ? (() => {
          const mutators = generateClientMutators(workspaceStore)
          const documentEnv = mutators.active().environment
          const workspaceEnv = mutators.workspace().environment
          return createVariablesStoreForRequest({
            environment,
            activeEnvironmentName,
            documentEnvironmentMutators: documentEnv,
            workspaceEnvironmentMutators: workspaceEnv,
            document: items[0]!.document,
            workspace: workspaceStore.workspace ?? null,
          })
        })()
      : undefined

  const results: OperationExampleRunResult[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!
    const { error, result } = await executeOperationRequest({
      document: item.document,
      operation: item.operation,
      path: item.path,
      method: item.method,
      exampleKey: item.exampleKey,
      environment,
      server,
      proxyUrl,
      globalCookies,
      selectedSecuritySchemes: item.selectedSecuritySchemes,
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
