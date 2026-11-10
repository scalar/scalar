import { isObjectLike } from '@scalar/helpers/object/is-object'
import { getExampleValue } from '@scalar/workspace-store/helpers/get-example-value'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

/** Keep a wrapper so the renderer unwraps Example Objects once without unwrapping object data. */
export const getRenderedExample = (entry: unknown, preferData = false): { value: unknown } | undefined => {
  const example = getResolvedRef(entry)
  if (!isObjectLike(example)) {
    return example === undefined ? undefined : { value: example }
  }
  const selected =
    preferData && example.dataValue !== undefined ? { value: example.dataValue } : getExampleValue(example)
  if (selected) {
    return { value: selected.value }
  }
  // Display the URL until the bundler has loaded an external example's payload.
  return example.externalValue !== undefined ? { value: example.externalValue } : undefined
}
