import { type MaybeRefOrGetter, reactive, ref, toRef, toValue, watch } from 'vue'

import { createEmptySpecification } from '@/helpers/createEmptySpecification'
import { parse } from '@/helpers/parse'

/**
 * Parse the OpenAPI document (immediately and when the content changes).
 *
 * @deprecated This is still in use, but want to refactor everything to use the new store.
 */
export function useReactiveSpec({
  content,
  proxyUrl,
}: {
  content: MaybeRefOrGetter<string>
  proxyUrl?: MaybeRefOrGetter<string>
}) {
  /** Fully parsed and resolved OAS object */
  const parsedSpec = reactive(createEmptySpecification())
  /** Parser error messages when parsing fails */
  const specErrors = ref<string | null>(null)

  /**
   * Parse the raw spec string into a resolved object
   * If there is an empty string (or no string) fallback to the default
   * If there are errors continue to show the previous valid spec
   */
  function parseInput(value?: string) {
    if (!value) {
      return Object.assign(parsedSpec, createEmptySpecification())
    }

    return parse(value, {
      proxyUrl: proxyUrl ? toValue(proxyUrl) : undefined,
    })
      .then((validSpec) => {
        specErrors.value = null

        // Some specs don't have servers, make sure they are defined
        Object.assign(parsedSpec, {
          ...validSpec,
        })
      })
      .catch((error) => {
        // Save the parse error message to display
        specErrors.value = error.toString()
      })
  }

  watch(
    () => toValue(content),
    (newContent) => {
      parseInput(newContent)
    },
    { immediate: true, deep: true },
  )

  return {
    rawSpec: toRef(content),
    parsedSpec,
    specErrors,
  }
}
