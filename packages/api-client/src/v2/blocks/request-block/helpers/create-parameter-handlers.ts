import { setValueAtPath } from '@scalar/helpers/object/set-value-at-path'
import type { OperationExampleMeta, WorkspaceEventBus } from '@scalar/workspace-store/events'

import type { TableRow } from '@/v2/blocks/request-block/components/RequestTableRow.vue'

type ParameterType = 'path' | 'cookie' | 'header' | 'query'

const isEmptyValue = (value: unknown): boolean => value === undefined || value === null || value === ''

const getExpandedObjectPayload = (
  row: TableRow,
  context: TableRow[],
  payload?: { name: string; value: string; isDisabled: boolean },
): { name: string; value: Record<string, unknown>; isDisabled: boolean } => {
  const value: Record<string, unknown> = {}

  for (const contextRow of context) {
    if (contextRow.originalParameter !== row.originalParameter || !contextRow.sourceParameterValuePath) {
      continue
    }

    if (contextRow === row && !payload) {
      continue
    }

    const nextValue = contextRow === row ? payload?.value : contextRow.value
    if (isEmptyValue(nextValue)) {
      continue
    }

    setValueAtPath(value, contextRow.sourceParameterValuePath, nextValue)
  }

  return {
    name: row.originalParameter?.name ?? payload?.name ?? row.name,
    value,
    isDisabled: payload?.isDisabled ?? row.isDisabled ?? false,
  }
}

/** Create parameter event handlers for a given type */
export const createParameterHandlers = (
  type: ParameterType,
  eventBus: WorkspaceEventBus,
  meta: OperationExampleMeta,
  {
    context,
    defaultParameters = 0,
    globalParameters = 0,
    onDeleteExpandedRow,
  }: {
    context: TableRow[]
    defaultParameters?: number
    globalParameters?: number
    onDeleteExpandedRow?: (row: TableRow) => void
  },
) => {
  const offset = defaultParameters + globalParameters

  return {
    delete: (payload: { index: number }) => {
      const row = context[payload.index]
      if (!row?.originalParameter) {
        return
      }

      if (row.sourceParameterValuePath) {
        onDeleteExpandedRow?.(row)

        return eventBus.emit(
          'operation:upsert:parameter',
          {
            type,
            payload: getExpandedObjectPayload(row, context),
            originalParameter: row.originalParameter,
            meta,
          },
          {
            skipUnpackProxy: true,
          },
        )
      }

      eventBus.emit(
        'operation:delete:parameter',
        {
          originalParameter: row.originalParameter,
          meta,
        },
        {
          skipUnpackProxy: true,
        },
      )
    },
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
        const nextPayload =
          row?.sourceParameterValuePath && row.originalParameter
            ? getExpandedObjectPayload(row, context, payload)
            : payload

        return eventBus.emit(
          'operation:upsert:parameter',
          {
            type,
            payload: nextPayload,
            originalParameter: row?.originalParameter ?? null,
            meta,
          },
          {
            skipUnpackProxy: true,
            debounceKey: `update:parameter-${type}-${index - offset}`,
          },
        )
      }
    },
  }
}
