import { isObject } from '@scalar/helpers/object/is-object'

/** Build the enabled portion of a query object without discarding stored disabled values. */
export const filterDisabledProperties = (
  value: unknown,
  states: Record<string, boolean>,
  inheritedDisabled: boolean,
  path: string[] = [],
): unknown => {
  const disabled = states[JSON.stringify(path)] ?? inheritedDisabled
  if (!isObject(value) || Array.isArray(value)) {
    return disabled ? undefined : value
  }

  const entries = Object.entries(value)
  const enabled = entries.flatMap(([key, child]) => {
    const filtered = filterDisabledProperties(child, states, disabled, [...path, key])
    return filtered === undefined ? [] : [[key, filtered] as const]
  })
  // Do not serialize parents whose children were all excluded.
  if (enabled.length === 0 && (disabled || entries.length > 0)) {
    return undefined
  }
  return Object.fromEntries(enabled)
}
