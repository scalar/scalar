import type { WorkspaceStore } from '@/client'
import type { HooksEvents } from '@/events/definitions/hooks'
import type { OperationEvents } from '@/events/definitions/operation'
import {
  updateOperationRequestBodyContentType,
  updateOperationRequestBodyExample,
  updateOperationRequestBodyFormValue,
} from '@/mutators/operation/body'
import { updateOperationExtension } from '@/mutators/operation/extensions'
import { addResponseToHistory, reloadOperationHistory } from '@/mutators/operation/history'
import {
  createOperation,
  createOperationDraftExample,
  deleteOperation,
  deleteOperationExample,
  updateOperationMeta,
  updateOperationPathMethod,
} from '@/mutators/operation/operation'
import {
  deleteAllOperationParameters,
  deleteOperationParameter,
  updateOperationExtraParameters,
  upsertOperationParameter,
} from '@/mutators/operation/parameters'
import type { WorkspaceDocument } from '@/schemas'

export const operationMutatorsFactory = ({
  document,
  store,
}: {
  document: WorkspaceDocument | null
  store: WorkspaceStore | null
}) => {
  return {
    createOperation: (payload: OperationEvents['operation:create:operation']) => createOperation(store, payload),
    updateOperationMeta: (payload: OperationEvents['operation:update:meta']) =>
      updateOperationMeta(store, document, payload),
    updateOperationPathMethod: (payload: OperationEvents['operation:update:pathMethod']) =>
      updateOperationPathMethod(document, store, payload),
    deleteOperation: (payload: OperationEvents['operation:delete:operation']) => deleteOperation(store, payload),
    createOperationDraftExample: (payload: OperationEvents['operation:create:draft-example']) =>
      createOperationDraftExample(store, payload),
    deleteOperationExample: (payload: OperationEvents['operation:delete:example']) =>
      deleteOperationExample(store, payload),
    updateOperationExtension: (payload: OperationEvents['operation:update:extension']) =>
      updateOperationExtension(document, payload),
    updateOperationExtraParameters: (payload: OperationEvents['operation:update:extra-parameters']) =>
      updateOperationExtraParameters(document, payload),
    upsertOperationParameter: (payload: OperationEvents['operation:upsert:parameter']) =>
      upsertOperationParameter(document, payload),
    deleteOperationParameter: (payload: OperationEvents['operation:delete:parameter']) =>
      deleteOperationParameter(document, payload),
    deleteAllOperationParameters: (payload: OperationEvents['operation:delete-all:parameters']) =>
      deleteAllOperationParameters(document, payload),
    updateOperationRequestBodyContentType: (payload: OperationEvents['operation:update:requestBody:contentType']) =>
      updateOperationRequestBodyContentType(document, payload),
    updateOperationRequestBodyExample: (payload: OperationEvents['operation:update:requestBody:value']) =>
      updateOperationRequestBodyExample(document, payload),
    updateOperationRequestBodyFormValue: (payload: OperationEvents['operation:update:requestBody:formValue']) =>
      updateOperationRequestBodyFormValue(document, payload),
    addResponseToHistory: (payload: HooksEvents['hooks:on:request:complete']) =>
      addResponseToHistory(store, document, payload),
    reloadOperationHistory: (payload: OperationEvents['operation:reload:history']) =>
      reloadOperationHistory(store, document, payload),
  }
}
