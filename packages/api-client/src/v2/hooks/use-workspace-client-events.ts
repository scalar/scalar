import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { mergeObjects } from '@scalar/workspace-store/helpers/merge-object'
import {
  addOperationParameter,
  addOperationRequestBodyFormRow,
  deleteAllOperationParameters,
  deleteOperationParameter,
  deleteOperationRequestBodyFormRow,
  deleteSecurityScheme,
  updateOperationMethod,
  updateOperationParameter,
  updateOperationPath,
  updateOperationRequestBodyContentType,
  updateOperationRequestBodyExample,
  updateOperationRequestBodyFormRow,
  updateOperationSummary,
  updateSecurityScheme,
  updateSelectedAuthTab,
  updateSelectedScopes,
  updateSelectedSecuritySchemes,
} from '@scalar/workspace-store/mutators'
import type { InfoObject } from '@scalar/workspace-store/schemas/v3.1/strict/info'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import type { PartialDeep } from 'type-fest'
import type { ComputedRef } from 'vue'

/**
 * Top level state mutation handling for the workspace store in the client
 */
export const useWorkspaceClientEvents = (
  eventBus: WorkspaceEventBus,
  document: ComputedRef<WorkspaceDocument | null>,
) => {
  //------------------------------------------------------------------------------------
  // Document Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on(
    'update:document-icon',
    (icon: string) => document.value && (document.value['x-scalar-client-config-icon'] = icon),
  )

  eventBus.on(
    'update:document-info',
    (info: PartialDeep<InfoObject>) =>
      document.value && (document.value.info = mergeObjects(document.value.info, info)),
  )

  //------------------------------------------------------------------------------------
  // Auth Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('delete:security-scheme', ({ names }) => {
    deleteSecurityScheme({
      document: document.value,
      names,
    })
  })

  eventBus.on('update:selected-scopes', ({ id, name, scopes, meta }) => {
    updateSelectedScopes({
      document: document.value,
      id,
      name,
      scopes,
      meta,
    })
  })
  eventBus.on('update:selected-security-schemes', ({ newSchemes, selectedRequirements, meta }) => {
    updateSelectedSecuritySchemes({
      document: document.value,
      newSchemes,
      selectedRequirements,
      meta,
    })
  })
  eventBus.on('update:security-scheme', ({ data, name }) => {
    updateSecurityScheme({
      document: document.value,
      data,
      name,
    })
  })
  eventBus.on('update:active-auth-index', ({ index, meta }) => {
    updateSelectedAuthTab({
      document: document.value,
      index,
      meta,
    })
  })

  //------------------------------------------------------------------------------------
  // Operation Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('operation:update:method', ({ payload, meta }) => {
    updateOperationMethod({
      document: document.value,
      meta,
      payload,
    })
  })

  eventBus.on('operation:update:path', ({ meta, payload }) => {
    updateOperationPath({
      document: document.value,
      meta,
      payload,
    })
  })

  eventBus.on('operation:update:summary', ({ payload, meta }) => {
    updateOperationSummary({
      document: document.value,
      meta,
      payload,
    })
  })

  eventBus.on('operation:add:parameter', ({ type, meta, payload }) => {
    addOperationParameter({
      document: document.value,
      meta,
      payload,
      type,
    })
  })
  eventBus.on('operation:update:parameter', ({ meta, payload, index, type }) => {
    updateOperationParameter({
      document: document.value,
      meta,
      payload,
      index,
      type,
    })
  })
  eventBus.on('operation:delete:parameter', ({ index, meta, type }) => {
    deleteOperationParameter({
      document: document.value,
      meta,
      index,
      type,
    })
  })
  eventBus.on('operation:delete-all:parameters', ({ meta, type }) => {
    deleteAllOperationParameters({
      document: document.value,
      meta,
      type,
    })
  })

  // operation body related event handlers
  eventBus.on('operation:update:requestBody:contentType', ({ payload, meta }) => {
    updateOperationRequestBodyContentType({
      document: document.value,
      meta,
      payload,
    })
  })

  eventBus.on('operation:update:requestBody:value', ({ contentType, payload, meta }) => {
    updateOperationRequestBodyExample({
      document: document.value,
      meta,
      payload,
      contentType,
    })
  })

  eventBus.on('operation:add:requestBody:formRow', ({ payload, contentType, meta }) => {
    addOperationRequestBodyFormRow({
      document: document.value,
      meta,
      payload,
      contentType,
    })
  })

  eventBus.on('operation:update:requestBody:formRow', ({ index, payload, contentType, meta }) => {
    updateOperationRequestBodyFormRow({
      document: document.value,
      meta,
      index,
      payload,
      contentType,
    })
  })

  eventBus.on('operation:delete:requestBody:formRow', ({ index, contentType, meta }) => {
    deleteOperationRequestBodyFormRow({
      document: document.value,
      meta,
      index,
      contentType,
    })
  })
}
