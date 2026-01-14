import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { OperationExampleMeta } from '@scalar/workspace-store/mutators'

import type { TableRow } from '@/v2/blocks/request-block/components/RequestTableRow.vue'

type ParameterType = 'path' | 'cookie' | 'header' | 'query'

/** Create parameter event handlers for a given type */
export const createParameterHandlers = (
  type: ParameterType,
  eventBus: WorkspaceEventBus,
  meta: OperationExampleMeta,
  {
    context,
    defaultParameters = 0,
    globalParameters = 0,
  }: {
    context: TableRow[]
    defaultParameters?: number
    globalParameters?: number
  },
) => {
  const offset = defaultParameters + globalParameters

  return {
    add: (payload: { key?: string; value?: string }) =>
      eventBus.emit('operation:add:parameter', {
        type,
        payload: {
          key: payload.key ?? '',
          value: payload.value ?? '',
          isDisabled: false,
        },
        meta,
      }),
    delete: (payload: { index: number }) =>
      eventBus.emit('operation:delete:parameter', {
        type,
        index: payload.index - offset,
        meta,
      }),
    deleteAll: () =>
      eventBus.emit('operation:delete-all:parameters', {
        type,
        meta,
      }),
    update: (payload: { index: number; payload: Partial<{ key: string; value: string; isDisabled: boolean }> }) => {
      if (payload.index < defaultParameters) {
        const row = context[payload.index]
        return eventBus.emit('operation:update:default-headers:parameter', {
          meta: { ...meta, key: row?.name.toLowerCase() ?? 'NON_VALID' },
          payload: { isDisabled: payload.payload.isDisabled ?? false },
        })
      }

      if (payload.index >= offset) {
        return eventBus.emit('operation:update:parameter', {
          type,
          index: payload.index - offset,
          payload: payload.payload,
          meta,
        })
      }
    },
  }
}
