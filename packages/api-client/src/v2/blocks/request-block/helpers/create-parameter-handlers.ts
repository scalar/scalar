import type { OperationExampleMeta, WorkspaceEventBus } from '@scalar/workspace-store/events'

type ParameterType = 'path' | 'cookie' | 'header' | 'query'

/** Create parameter event handlers for a given type */
export const createParameterHandlers = (
  type: ParameterType,
  eventBus: WorkspaceEventBus,
  meta: OperationExampleMeta,
) => ({
  add: (payload: { name?: string; value?: string }) =>
    eventBus.emit('operation:add:parameter', {
      type,
      payload: {
        name: payload.name ?? '',
        value: payload.value ?? '',
        isDisabled: false,
      },
      meta,
    }),
  delete: (payload: { index: number }) =>
    eventBus.emit('operation:delete:parameter', {
      type,
      index: payload.index,
      meta,
    }),
  deleteAll: () =>
    eventBus.emit('operation:delete-all:parameters', {
      type,
      meta,
    }),
  update: (payload: { index: number; payload: Partial<{ name: string; value: string; isDisabled: boolean }> }) =>
    eventBus.emit(
      'operation:update:parameter',
      {
        type,
        ...payload,
        meta,
      },
      {
        debounceKey: `update:parameter-${type}-${payload.index}-${Object.keys(payload.payload).join('-')}`,
      },
    ),
})
