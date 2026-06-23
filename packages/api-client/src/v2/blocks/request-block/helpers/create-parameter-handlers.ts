import { setValueAtPath } from '@scalar/helpers/object/set-value-at-path'
import type { OperationExampleMeta, WorkspaceEventBus } from '@scalar/workspace-store/events'
import { deSerializeSchemaValue } from '@scalar/workspace-store/request-example'

import type { TableRow } from '@/v2/blocks/request-block/components/RequestTableRow.vue'

type ParameterType = 'path' | 'cookie' | 'header' | 'query'

type ParameterUpsertPayload = {
  name: string
  value: string
  isDisabled: boolean
  shouldRenameExpandedRow?: boolean
}

const isEmptyValue = (value: unknown): boolean => value === undefined || value === null || value === ''

/**
 * Whether a row name carries the display-only deepObject array marker (`filters[id][in][]`). The
 * marker is only ever appended after a real path bracket, so it always shows up as `][]`. That lets
 * us tell it apart from a genuinely empty key: an interior empty (`filters[][in]`) or a lone empty
 * group (`filters[]`, value path `['']`) is not a marker and keeps its segment.
 */
const hasArrayMarker = (name: string): boolean => name.endsWith('][]')

/** Parse a parameter key like `filter[a][b]` into its path segments `['filter', 'a', 'b']`. */
const parseBracketKey = (name: string): string[] => {
  // Strip the trailing array marker first. The trailing brackets on a deepObject array leaf are
  // display-only, not part of the value path — keeping them would add a bogus empty key that drops
  // the value on write-back and corrupts rename tracking.
  const withoutArrayMarker = hasArrayMarker(name) ? name.slice(0, -2) : name

  const segments: string[] = []
  const head = withoutArrayMarker.match(/^[^[\]]*/)?.[0] ?? ''
  if (head) {
    segments.push(head)
  }
  for (const match of withoutArrayMarker.matchAll(/\[([^\]]*)\]/g)) {
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
  payload?: ParameterUpsertPayload,
): { name: string; value: Record<string, unknown>; isDisabled: boolean } => {
  const value: Record<string, unknown> = {}

  // Only deepObject leaves use the comma-to-array coercion below. The trailing-bracket array
  // convention (`key[]=1&key[]=2`) is deepObject-specific, and deepObject leaves never carry a
  // meaningful comma. Form-style object parameters can (e.g. Spring `sort=username,asc`), so they
  // keep their leaves verbatim.
  const parameter = row.originalParameter
  const isDeepObjectParameter = Boolean(parameter && 'style' in parameter && parameter.style === 'deepObject')

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

    // Key edits are debounced while the user is still typing. Only committed key edits can move
    // the value to a new object path; regular value updates keep the stable source path.
    const path = isEditedRow
      ? payload.shouldRenameExpandedRow
        ? getEditedValuePath(payload.name, row.originalParameter?.name, contextRow.sourceParameterValuePath)
        : contextRow.sourceParameterValuePath
      : contextRow.sourceParameterValuePath

    // Rows always hold the string the user sees, so a deepObject array leaf arrives comma-joined
    // ("1,2"). Coerce it back to an array before storing — otherwise deepObject serialization
    // re-collapses it into a single `key[in]=1,2` entry instead of repeating `key[in][]=1&key[in][]=2`.
    //
    // The display-only `][]` marker is the authoritative array signal: a leaf gets it whenever its
    // schema OR its stored value is an array, so it must win over a non-array property schema, which
    // would otherwise skip the coercion and serialize the array comma-joined. A committed rename
    // re-derives the marker from the freshly typed name, since the row's `schema` and `name` still
    // describe the old key — renaming an array leaf to a scalar key must not store a one-element array.
    // Non-array leaves fall back to the property schema so object leaves still coerce; renamed rows
    // have no reliable schema, so they rely on the marker alone.
    const isCommittedRename = isEditedRow && Boolean(payload.shouldRenameExpandedRow)
    const hasArrayLeafMarker = hasArrayMarker(isCommittedRename ? payload.name : contextRow.name)
    const leafSchema = hasArrayLeafMarker
      ? ({ type: 'array' } as const)
      : isCommittedRename
        ? undefined
        : contextRow.schema
    const leafValue = isDeepObjectParameter && leafSchema ? deSerializeSchemaValue(nextValue, leafSchema) : nextValue

    setValueAtPath(value, path, leafValue)
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
    onRenameExpandedRow?: (row: TableRow, newValuePath: string[]) => void
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
    upsert: (index: number, payload: ParameterUpsertPayload) => {
      const row = context[index]
      const { shouldRenameExpandedRow, ...parameterPayload } = payload

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

        // When the key of an expanded row changes, report the new value path so the row keeps its
        // original slot (rendered in place of the old schema property) instead of jumping to the end.
        if (isExpandedRow && row && shouldRenameExpandedRow && payload.name !== row.name) {
          const newValuePath = getEditedValuePath(
            payload.name,
            row.originalParameter?.name,
            row.sourceParameterValuePath ?? [],
          )
          onRenameExpandedRow?.(row, newValuePath)
        }

        const nextPayload = isExpandedRow && row ? getExpandedObjectPayload(row, context, payload) : parameterPayload

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
