import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { ApiReferenceEvents, CollectionType, WorkspaceEventBus } from '@scalar/workspace-store/events'
import { generateClientMutators } from '@scalar/workspace-store/mutators'
import { type Ref, computed } from 'vue'

type Hook<T extends keyof ApiReferenceEvents> = Partial<{
  onBeforeExecute: (
    payload: ApiReferenceEvents[T],
  ) => void | Promise<void> | ApiReferenceEvents[T] | Promise<ApiReferenceEvents[T]>
  onAfterExecute: (payload: ApiReferenceEvents[T]) => void | Promise<void>
}>

type Hooks = {
  [key in keyof ApiReferenceEvents]?: Hook<key>
}

/**
 * Wraps a given function with optional before/after execution hooks for a specific event.
 * - Calls onBeforeExecute hook before executing the main function.
 * - Calls onAfterExecute hook after executing the main function.
 *
 * @template T The event key from ApiReferenceEvents
 * @param event The event name
 * @param fn The main function to execute
 * @param hooks The hooks object containing before/after hooks for events
 * @returns An async function that runs hooks around the main function
 */
const withHook = <T extends keyof ApiReferenceEvents>(
  event: T,
  fn: (args: ApiReferenceEvents[T]) => unknown | Promise<unknown>,
  hooks: Hooks,
) => {
  return async (args: ApiReferenceEvents[T]) => {
    // Call the before execution hook for this event, if any
    const result = (await hooks[event]?.onBeforeExecute?.(args)) ?? args
    // Execute the main function
    await fn(result)
    // Call the after execution hook for this event, if any
    await hooks[event]?.onAfterExecute?.(result)
    return result
  }
}

/**
 * Initializes all Workspace Event Handlers by subscribing eventBus listeners
 * to each relevant mutator operation. Hooks are used for before/after execution.
 *
 * @param eventBus The WorkspaceEventBus to subscribe to
 * @param store The WorkspaceStore instance
 * @param hooks Object containing optional before/after hooks for each event
 */
export function initializeWorkspaceEventHandlers({
  eventBus,
  store,
  hooks,
}: {
  eventBus: WorkspaceEventBus
  store: Ref<WorkspaceStore | null>
  hooks: Hooks
}) {
  // Generate all client mutators for the current workspace store
  const mutators = computed(() => generateClientMutators(store.value))

  /**
   * Returns the appropriate mutators depending on the collectionType.
   * If collectionType is 'document', gets the active document mutator,
   * otherwise, gets the workspace mutator.
   */
  const getMutators = ({ collectionType }: CollectionType) => {
    if (collectionType === 'document') {
      return mutators.value.active()
    }
    return mutators.value.workspace()
  }

  //------------------------------------------------------------------------------------
  // Workspace Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('workspace:update:active-proxy', (payload) =>
    withHook('workspace:update:active-proxy', mutators.value.workspace().workspace.updateActiveProxy, hooks)(payload),
  )
  eventBus.on('workspace:update:color-mode', (payload) =>
    withHook('workspace:update:color-mode', mutators.value.workspace().workspace.updateColorMode, hooks)(payload),
  )
  eventBus.on('workspace:update:theme', (payload) =>
    withHook('workspace:update:theme', mutators.value.workspace().workspace.updateTheme, hooks)(payload),
  )
  eventBus.on('workspace:update:selected-client', (payload) =>
    withHook(
      'workspace:update:selected-client',
      mutators.value.workspace().workspace.updateSelectedClient,
      hooks,
    )(payload),
  )
  eventBus.on('workspace:update:active-environment', (payload) =>
    withHook(
      'workspace:update:active-environment',
      mutators.value.workspace().workspace.updateActiveEnvironment,
      hooks,
    )(payload),
  )

  //------------------------------------------------------------------------------------
  // Document Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('document:update:icon', (payload) =>
    withHook('document:update:icon', mutators.value.active().document.updateDocumentIcon, hooks)(payload),
  )
  eventBus.on('document:update:info', (payload) =>
    withHook('document:update:info', mutators.value.active().document.updateDocumentInfo, hooks)(payload),
  )
  eventBus.on('document:toggle:security', (payload) =>
    withHook('document:toggle:security', mutators.value.active().document.toggleSecurity, hooks)(payload),
  )
  eventBus.on('document:update:watch-mode', (payload) =>
    withHook('document:update:watch-mode', mutators.value.active().document.updateWatchMode, hooks)(payload),
  )
  eventBus.on('document:create:empty-document', (payload) =>
    withHook('document:create:empty-document', mutators.value.active().document.createEmptyDocument, hooks)(payload),
  )
  eventBus.on('document:delete:document', (payload) =>
    withHook('document:delete:document', mutators.value.active().document.deleteDocument, hooks)(payload),
  )

  //------------------------------------------------------------------------------------
  // Environment Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('environment:upsert:environment', (payload) =>
    withHook('environment:upsert:environment', getMutators(payload).environment.upsertEnvironment, hooks)(payload),
  )
  eventBus.on('environment:delete:environment', (payload) =>
    withHook('environment:delete:environment', getMutators(payload).environment.deleteEnvironment, hooks)(payload),
  )
  eventBus.on('environment:upsert:environment-variable', (payload) =>
    withHook(
      'environment:upsert:environment-variable',
      getMutators(payload).environment.upsertEnvironmentVariable,
      hooks,
    )(payload),
  )
  eventBus.on('environment:delete:environment-variable', (payload) =>
    withHook(
      'environment:delete:environment-variable',
      getMutators(payload).environment.deleteEnvironmentVariable,
      hooks,
    )(payload),
  )

  //------------------------------------------------------------------------------------
  // Cookie Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('cookie:upsert:cookie', async (payload) => {
    await withHook('cookie:upsert:cookie', getMutators(payload).cookie.upsertCookie, hooks)(payload)
  })
  eventBus.on('cookie:delete:cookie', async (payload) => {
    await withHook('cookie:delete:cookie', getMutators(payload).cookie.deleteCookie, hooks)(payload)
  })

  //------------------------------------------------------------------------------------
  // Auth Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('auth:delete:security-scheme', (payload) =>
    withHook('auth:delete:security-scheme', mutators.value.active().auth.deleteSecurityScheme, hooks)(payload),
  )
  eventBus.on('auth:update:active-index', (payload) =>
    withHook('auth:update:active-index', mutators.value.active().auth.updateSelectedAuthTab, hooks)(payload),
  )
  eventBus.on('auth:update:security-scheme', (payload) =>
    withHook('auth:update:security-scheme', mutators.value.active().auth.updateSecurityScheme, hooks)(payload),
  )
  eventBus.on('auth:update:selected-scopes', (payload) =>
    withHook('auth:update:selected-scopes', mutators.value.active().auth.updateSelectedScopes, hooks)(payload),
  )
  eventBus.on('auth:update:selected-security-schemes', (payload) =>
    withHook(
      'auth:update:selected-security-schemes',
      mutators.value.active().auth.updateSelectedSecuritySchemes,
      hooks,
    )(payload),
  )
  eventBus.on('auth:update:security-scheme-secrets', (payload) =>
    withHook(
      'auth:update:security-scheme-secrets',
      mutators.value.active().auth.updateSecuritySchemeSecrets,
      hooks,
    )(payload),
  )

  //------------------------------------------------------------------------------------
  // Server Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('server:add:server', (payload) =>
    withHook('server:add:server', mutators.value.active().server.addServer, hooks)(payload),
  )
  eventBus.on('server:update:server', (payload) =>
    withHook('server:update:server', mutators.value.active().server.updateServer, hooks)(payload),
  )
  eventBus.on('server:delete:server', (payload) =>
    withHook('server:delete:server', mutators.value.active().server.deleteServer, hooks)(payload),
  )
  eventBus.on('server:update:variables', (payload) =>
    withHook('server:update:variables', mutators.value.active().server.updateServerVariables, hooks)(payload),
  )
  eventBus.on('server:update:selected', (payload) =>
    withHook('server:update:selected', mutators.value.active().server.updateSelectedServer, hooks)(payload),
  )

  //------------------------------------------------------------------------------------
  // Operation Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('operation:create:operation', (payload) =>
    withHook('operation:create:operation', mutators.value.active().operation.createOperation, hooks)(payload),
  )
  eventBus.on('operation:update:pathMethod', (payload) =>
    withHook(
      'operation:update:pathMethod',
      mutators.value.active().operation.updateOperationPathMethod,
      hooks,
    )(payload),
  )
  eventBus.on('operation:update:summary', (payload) =>
    withHook('operation:update:summary', mutators.value.active().operation.updateOperationSummary, hooks)(payload),
  )
  eventBus.on('operation:delete:operation', (payload) =>
    withHook('operation:delete:operation', mutators.value.active().operation.deleteOperation, hooks)(payload),
  )
  eventBus.on('operation:delete:example', (payload) =>
    withHook('operation:delete:example', mutators.value.active().operation.deleteOperationExample, hooks)(payload),
  )
  eventBus.on('operation:upsert:parameter', (payload) =>
    withHook('operation:upsert:parameter', mutators.value.active().operation.upsertOperationParameter, hooks)(payload),
  )
  eventBus.on('operation:update:extra-parameters', (payload) =>
    withHook(
      'operation:update:extra-parameters',
      mutators.value.active().operation.updateOperationExtraParameters,
      hooks,
    )(payload),
  )
  eventBus.on('operation:delete:parameter', (payload) =>
    withHook('operation:delete:parameter', mutators.value.active().operation.deleteOperationParameter, hooks)(payload),
  )
  eventBus.on('operation:delete-all:parameters', (payload) =>
    withHook(
      'operation:delete-all:parameters',
      mutators.value.active().operation.deleteAllOperationParameters,
      hooks,
    )(payload),
  )

  //------------------------------------------------------------------------------------
  // Operation Request Body Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('operation:update:requestBody:contentType', (payload) =>
    withHook(
      'operation:update:requestBody:contentType',
      mutators.value.active().operation.updateOperationRequestBodyContentType,
      hooks,
    )(payload),
  )
  eventBus.on('operation:update:requestBody:value', (payload) =>
    withHook(
      'operation:update:requestBody:value',
      mutators.value.active().operation.updateOperationRequestBodyExample,
      hooks,
    )(payload),
  )
  eventBus.on('operation:update:requestBody:formValue', (payload) =>
    withHook(
      'operation:update:requestBody:formValue',
      mutators.value.active().operation.updateOperationRequestBodyFormValue,
      hooks,
    )(payload),
  )
  eventBus.on('operation:reload:history', (payload) =>
    withHook('operation:reload:history', mutators.value.active().operation.reloadOperationHistory, hooks)(payload),
  )

  //------------------------------------------------------------------------------------
  // Tag Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('tag:create:tag', (payload) =>
    withHook('tag:create:tag', mutators.value.active().tag.createTag, hooks)(payload),
  )
  eventBus.on('tag:delete:tag', (payload) =>
    withHook('tag:delete:tag', mutators.value.active().tag.deleteTag, hooks)(payload),
  )

  //------------------------------------------------------------------------------------
  // Tabs Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('tabs:add:tab', (payload) =>
    withHook('tabs:add:tab', mutators.value.workspace().tabs.addTab, hooks)(payload),
  )
  eventBus.on('tabs:close:tab', (payload) =>
    withHook('tabs:close:tab', mutators.value.workspace().tabs.closeTab, hooks)(payload),
  )
  eventBus.on('tabs:close:other-tabs', (payload) =>
    withHook('tabs:close:other-tabs', mutators.value.workspace().tabs.closeOtherTabs, hooks)(payload),
  )
  eventBus.on('tabs:focus:tab', (payload) =>
    withHook('tabs:focus:tab', mutators.value.workspace().tabs.focusTab, hooks)(payload),
  )
  eventBus.on('tabs:focus:tab-last', (payload) =>
    withHook('tabs:focus:tab-last', mutators.value.workspace().tabs.focusLastTab, hooks)(payload),
  )
  eventBus.on('tabs:navigate:previous', (payload) =>
    withHook('tabs:navigate:previous', mutators.value.workspace().tabs.navigatePreviousTab, hooks)(payload),
  )
  eventBus.on('tabs:navigate:next', (payload) =>
    withHook('tabs:navigate:next', mutators.value.workspace().tabs.navigateNextTab, hooks)(payload),
  )
  eventBus.on('tabs:update:tabs', (payload) =>
    withHook('tabs:update:tabs', mutators.value.workspace().tabs.updateTabs, hooks)(payload),
  )

  //------------------------------------------------------------------------------------
  // Hooks Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('hooks:on:request:complete', (payload) =>
    withHook('hooks:on:request:complete', mutators.value.active().operation.addResponseToHistory, hooks)(payload),
  )
}
