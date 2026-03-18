import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { type ClientPlugin, type VariablesStore, executeHook } from '@scalar/oas-utils/helpers'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { generateClientMutators } from '@scalar/workspace-store/mutators'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import type { OpenApiDocument, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'

import type { SecuritySchemeObjectSecret } from '@/v2/blocks/scalar-auth-selector-block/helpers/secret-types'

import { buildRequest } from './build-request'
import { createVariablesStoreForRequest } from './create-variables-store-for-request'
import { mergeEnvironmentWithLocals } from './merge-environment-with-locals'
import { sendRequest } from './send-request'
import type { ResponseInstance } from './send-request'
import { validatePathParameters } from './validate-path-parameters'

export type ExecuteOperationRequestParams = {
  document: OpenApiDocument
  operation: OperationObject
  path: string
  method: HttpMethod
  exampleKey: string
  environment: XScalarEnvironment
  server: ServerObject | null
  proxyUrl: string
  globalCookies: XScalarCookie[]
  selectedSecuritySchemes: SecuritySchemeObjectSecret[]
  plugins: ClientPlugin[]
  /** When provided, hooks are emitted (e.g. for history, UI). Omit for runner. */
  eventBus?: WorkspaceEventBus
  /** When provided with activeEnvironmentName, used to create variablesStore if variablesStore not provided. */
  workspaceStore?: WorkspaceStore | null
  /** Currently selected environment name; used to create variablesStore when variablesStore not provided. */
  activeEnvironmentName?: string
  /**
   * Optional shared variables store. When provided, local variables from scripts
   * are merged into the environment for this request (so previous script-set
   * variables are visible), and scripts can update it for the next request.
   * Used by the sequential runner to share state across operations.
   */
  variablesStore?: VariablesStore
}

export type ExecuteOperationRequestResult = {
  error: { message: string } | null
  result: {
    response: ResponseInstance
    request: Request
    timestamp: number
    originalResponse: Response
  } | null
  /** AbortController for the request; caller can call abort() to cancel. */
  controller: AbortController
  /** The variables store used (created or passed in). Pass to next execute for runner. */
  variablesStore: VariablesStore | undefined
}

/**
 * Builds the request, runs pre-request hooks (scripts), sends the request, then
 * runs post-response hooks (scripts). Can be used from the operation block (single
 * run) or from a runner (sequential runs with a shared variablesStore).
 *
 * When variablesStore is provided, environment is merged with its local variables
 * so script-set variables from a previous request are visible when building this request.
 */
export async function executeOperationRequest(
  params: ExecuteOperationRequestParams,
): Promise<ExecuteOperationRequestResult> {
  const {
    document,
    operation,
    path,
    method,
    exampleKey,
    environment,
    server,
    proxyUrl,
    globalCookies,
    selectedSecuritySchemes,
    plugins,
    eventBus,
    workspaceStore,
    activeEnvironmentName,
    variablesStore: providedVariablesStore,
  } = params

  const pathValidation = validatePathParameters(operation.parameters ?? [], exampleKey)
  if (pathValidation.ok === false) {
    return {
      error: { message: 'Path parameters must have values.' },
      result: null,
      controller: new AbortController(),
      variablesStore: providedVariablesStore,
    }
  }

  const variablesStore =
    providedVariablesStore ??
    (workspaceStore && activeEnvironmentName
      ? (() => {
          const mutators = generateClientMutators(workspaceStore)
          const documentEnv = mutators.active().environment
          const workspaceEnv = mutators.workspace().environment
          return createVariablesStoreForRequest({
            environment,
            activeEnvironmentName,
            documentEnvironmentMutators: documentEnv,
            workspaceEnvironmentMutators: workspaceEnv,
            document,
            workspace: workspaceStore.workspace ?? null,
          })
        })()
      : undefined)

  let effectiveEnvironment =
    variablesStore?.getLocalVariables
      ? mergeEnvironmentWithLocals(environment, variablesStore.getLocalVariables())
      : environment

  if (plugins.length > 0) {
    // Build a preliminary request so the pre-request hook has a request to read (e.g. URL).
    const [prelimBuildError, prelimBuildResult] = buildRequest({
      environment: effectiveEnvironment,
      exampleKey,
      globalCookies,
      method,
      operation,
      path,
      selectedSecuritySchemes,
      server,
      proxyUrl,
    })

    if (prelimBuildError) {
      return {
        error: prelimBuildError,
        result: null,
        controller: new AbortController(),
        variablesStore,
      }
    }

    // Run pre-request hook before final build so scripts can set variables (pm.variables.set)
    // that are then used when we build the final request (e.g. {{token}} in path/headers/body).
    await executeHook(
      {
        request: prelimBuildResult!.request,
        document,
        operation,
        variablesStore,
      },
      'beforeRequest',
      plugins,
    )

    effectiveEnvironment =
      variablesStore?.getLocalVariables
        ? mergeEnvironmentWithLocals(environment, variablesStore.getLocalVariables())
        : environment
  }

  const [buildError, buildResult] = buildRequest({
    environment: effectiveEnvironment,
    exampleKey,
    globalCookies,
    method,
    operation,
    path,
    selectedSecuritySchemes,
    server,
    proxyUrl,
  })

  if (buildError) {
    return {
      error: buildError,
      result: null,
      controller: new AbortController(),
      variablesStore,
    }
  }

  const controller = buildResult!.controller

  eventBus?.emit('hooks:on:request:sent', {
    meta: { method, path, exampleKey },
  })

  const [sendError, sendResult] = await sendRequest({
    isUsingProxy: buildResult!.isUsingProxy,
    operation,
    document,
    plugins,
    request: buildResult!.request,
    variablesStore,
    skipBeforeRequest: plugins.length > 0,
  })

  eventBus?.emit('hooks:on:request:complete', {
    payload: sendResult
      ? {
          response: sendResult.originalResponse,
          request: sendResult.request.clone(),
          duration: sendResult.response.duration,
          timestamp: sendResult.timestamp,
        }
      : undefined,
    meta: { method, path, exampleKey },
  })

  return {
    error: sendError,
    result: sendResult,
    controller,
    variablesStore,
  }
}
