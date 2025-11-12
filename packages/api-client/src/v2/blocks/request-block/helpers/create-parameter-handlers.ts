import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { OperationExampleMeta } from '@scalar/workspace-store/mutators'

type ParameterType = 'path' | 'cookie' | 'header' | 'query'

/** Create parameter event handlers for a given type */
export const createParameterHandlers = (
  type: ParameterType,
  eventBus: WorkspaceEventBus,
  meta: OperationExampleMeta,
) => ({
  onAdd: (payload: { key?: string; value?: string }) =>
    eventBus.emit('operation:add:parameter', {
      type,
      payload: {
        key: payload.key ?? '',
        value: payload.value ?? '',
        isEnabled: true,
      },
      meta,
    }),
  onDelete: (payload: { index: number }) =>
    eventBus.emit('operation:delete:parameter', {
      type,
      index: payload.index,
      meta,
    }),
  onDeleteAll: () =>
    eventBus.emit('operation:delete-all:parameters', {
      type,
      meta,
    }),
  onUpdate: (payload: { index: number; payload: Partial<{ key: string; value: string; isEnabled: boolean }> }) =>
    eventBus.emit('operation:update:parameter', {
      type,
      index: payload.index,
      payload: payload.payload,
      meta,
    }),
})
