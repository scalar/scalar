import { setValueAtPath } from '@scalar/helpers/object/set-value-at-path'
import type { OperationExampleMeta, WorkspaceEventBus } from '@scalar/workspace-store/events'

import type { TableRow } from '@/v2/blocks/request-block/components/RequestTableRow.vue'

type ParameterType = 'path' | 'cookie' | 'header' | 'query'

const isEmptyValue = (value: unknown): boolean => value === undefined || value === null || value === ''

/** Parse a parameter key like `filter[a][b]` into its path segments `['filter', 'a', 'b']`. */
const parseBracketKey = (name: string): string[] => {
  const segments: string[] = []
  const head = name.match(/^[^[\]]*/)?.[0] ?? ''
  if (head) {
    segments.push(head)
  }
  for (const match of name.matchAll(/\[([^\]]*)\]/g)) {
    segments.push(match[1] ?? '')
  }
  return segments
}

/**
 * Derives the value path for an edited expanded row from the key the user typed, so renaming a
 * property actually moves the value to the new key instead of being dropped. deepObject rows are
 * prefixed with the parent parameter name (`filter[a]`), which we strip to get the path inside the
 * value. Falls back to the row's original path when the typed name cannot be parsed.
 */
const getEditedValuePath = (typedName: string, parameterName: string | undefined, fallback: string[]): string[] => {
  const segments = parseBracketKey(typedName)
  if (segments.length === 0) {
    return fallback
  }
  if (parameterName && segments[0] === parameterName && segments.length > 1) {
    return segments.slice(1)
  }
  return segments
}

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

    const isEditedRow = contextRow === row && payload !== undefined
    const nextValue = isEditedRow ? payload.value : contextRow.value
    if (isEmptyValue(nextValue)) {
      continue
    }

    // For the edited row, honor the key the user typed so the rename reaches the query.
    const path = isEditedRow
      ? getEditedValuePath(payload.name, row.originalParameter?.name, contextRow.sourceParameterValuePath)
      : contextRow.sourceParameterValuePath

    setValueAtPath(value, path, nextValue)
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
    onRenameExpandedRow,
  }: {
    context: TableRow[]
    defaultParameters?: number
    globalParameters?: number
    onDeleteExpandedRow?: (row: TableRow) => void
    onRenameExpandedRow?: (row: TableRow) => void
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
        const isExpandedRow = Boolean(row?.sourceParameterValuePath && row.originalParameter)

        // When the key of an expanded row changes, retire the old schema path so the original
        // property name does not pop back up as an empty suggestion next to the renamed row.
        if (isExpandedRow && row && payload.name !== row.name) {
          onRenameExpandedRow?.(row)
        }

        const nextPayload = isExpandedRow && row ? getExpandedObjectPayload(row, context, payload) : payload

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
