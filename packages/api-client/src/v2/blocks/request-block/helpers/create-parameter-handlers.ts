import type { OperationExampleMeta, WorkspaceEventBus } from '@scalar/workspace-store/events'

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
    upsert: (index: number, payload: { name: string; value: string; isDisabled: boolean }) => {
      const row = context[index]

      if (index < defaultParameters + globalParameters) {
        const extraParameterType = index < defaultParameters ? 'default' : 'global'

        return eventBus.emit('operation:update:extra-parameters', {
          type: extraParameterType,
          in: type,
          meta: { ...meta, name: row?.name?.toLowerCase?.() ?? 'NON_VALID' },
          payload: { isDisabled: payload.isDisabled ?? false },
        })
      }

      if (index >= offset) {
        return eventBus.emit(
          'operation:upsert:parameter',
          {
            type,
            index: index - offset,
            payload: payload,
            meta,
          },
          {
            debounceKey: `update:parameter-${type}-${index - offset}`,
          },
        )
      }
    },
  }
}
