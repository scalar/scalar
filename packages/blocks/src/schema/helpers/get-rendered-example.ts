import { isObjectLike } from '@scalar/helpers/object/is-object'
import { getExampleValue } from '@scalar/workspace-store/helpers/get-example-value'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

/** Only renderer-created wrappers carry this marker; JSON payload fields remain ordinary data. */
const renderedExample = Symbol('rendered-example')

/** Display metadata stays separate from the selected payload, including payloads with a `value` field. */
export type RenderedExample = {
  [renderedExample]: true
  name?: string
  summary?: string
  value: unknown
}

/** Resolve a named Example Object once, preserving its label and the existing value preference. */
export const getRenderedExample = (entry: unknown, name?: string, preferData = false): RenderedExample | undefined => {
  const example = getResolvedRef(entry)
  if (!isObjectLike(example)) {
    return example === undefined ? undefined : { [renderedExample]: true, name, value: example }
  }
  const selected =
    preferData && example.dataValue !== undefined ? { value: example.dataValue } : getExampleValue(example)
  // Display the URL until the bundler has loaded an external example's payload.
  const value = selected ? selected.value : example.externalValue
  const summary = isObjectLike(entry) && typeof entry.summary === 'string' ? entry.summary : example.summary
  return value === undefined
    ? undefined
    : {
        [renderedExample]: true,
        name,
        summary: typeof summary === 'string' ? summary : undefined,
        value,
      }
}

/** Schema arrays contain raw payloads; named maps contain Example Objects. Never infer metadata from payload keys. */
export const normalizeRenderedExamples = (examples: unknown): RenderedExample[] => {
  if (Array.isArray(examples)) {
    return examples
      .filter((value) => value !== undefined)
      .map((value: unknown) => {
        if (isObjectLike(value) && renderedExample in value && value[renderedExample] === true) {
          return value as RenderedExample
        }
        return { [renderedExample]: true, value }
      })
  }
  if (isObjectLike(examples)) {
    return Object.entries(examples).flatMap(([name, entry]) => {
      const example = getRenderedExample(entry, name)
      return example ? [example] : []
    })
  }
  return []
}
