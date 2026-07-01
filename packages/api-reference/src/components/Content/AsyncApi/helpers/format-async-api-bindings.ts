import { isObject } from '@scalar/helpers/object/is-object'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

/** A single protocol entry within a bindings object, flattened for rendering. */
type AsyncApiBindingEntry = {
  /** The binding field key (for example `topic`, `qos`, `bindingVersion`). */
  key: string
  /** The field value. Primitives render inline; objects/arrays render as JSON. */
  value: unknown
}

/** One protocol's bindings, ready to render as a labeled key/value group. */
type AsyncApiBindingGroup = {
  /** Protocol identifier (for example `kafka`, `amqp`, `ws`). */
  protocol: string
  /** Flattened field entries for the protocol. */
  entries: AsyncApiBindingEntry[]
}

/**
 * Normalize an AsyncAPI bindings object (server / channel / operation / message) into a list of
 * per-protocol groups for rendering.
 *
 * The bindings object itself may be a `$ref`, and each protocol's value may be a `$ref`, so both
 * layers are resolved. Protocols whose value is `null`/`undefined` are skipped, matching how the
 * existing message protocol-label logic ignores empty entries.
 */
export const formatAsyncApiBindings = (bindings: unknown): AsyncApiBindingGroup[] => {
  // `isObject` already rejects `null`/`undefined`, so a nullish `bindings` short-circuits here too.
  const resolved = getResolvedRef(bindings)
  if (!isObject(resolved)) {
    return []
  }

  const groups: AsyncApiBindingGroup[] = []

  for (const [protocol, rawValue] of Object.entries(resolved)) {
    if (rawValue == null) {
      continue
    }

    const value = getResolvedRef(rawValue)

    // A binding payload is normally an object of fields; flatten those into key/value entries,
    // dropping fields with no value so we never render the literal text `null`/`undefined`.
    // Non-object payloads (rare, but allowed since most protocols are typed as `unknown`) are
    // surfaced under a single synthetic `value` entry so nothing is silently dropped — unless the
    // value resolved to nullish (for example an unresolved `$ref`), in which case the protocol is
    // skipped rather than shown as `value: undefined`.
    const entries: AsyncApiBindingEntry[] = isObject(value)
      ? Object.entries(value)
          .filter(([, fieldValue]) => fieldValue != null)
          .map(([key, fieldValue]) => ({ key, value: fieldValue }))
      : value == null
        ? []
        : [{ key: 'value', value }]

    if (entries.length > 0) {
      groups.push({ protocol, entries })
    }
  }

  return groups
}

/** Whether a binding value should render as a JSON code block rather than inline text. */
export const isComplexBindingValue = (value: unknown): boolean => isObject(value) || Array.isArray(value)
