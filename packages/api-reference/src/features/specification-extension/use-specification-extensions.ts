import { type ComputedRef, computed } from 'vue'

import { type PluginManager, usePluginManager } from '@/plugins'

/** Share extension selection with layouts that must hide empty metadata sections. */
export const useSpecificationExtensions = (
  value: () => Record<string, unknown> | undefined,
  showExtensions: () => string[] | undefined,
): {
  customExtensions: ComputedRef<ReturnType<PluginManager['getSpecificationExtensions']>>
  defaultExtensions: ComputedRef<Record<string, unknown>>
  hasExtensions: ComputedRef<boolean>
} => {
  const { getSpecificationExtensions } = usePluginManager()
  const customExtensions = computed(() =>
    Object.keys(value() ?? {})
      .filter((name): name is `x-${string}` => name.startsWith('x-'))
      .flatMap((name) => getSpecificationExtensions(name))
      .filter((extension) => extension.component),
  )
  // Custom plugin components retain ownership of their extension keys.
  const defaultExtensions = computed<Record<string, unknown>>(() =>
    Object.fromEntries(
      [...new Set(showExtensions() ?? [])]
        .filter(
          (name) =>
            name.startsWith('x-') &&
            Object.hasOwn(value() ?? {}, name) &&
            !customExtensions.value.some((extension) => extension.name === name),
        )
        .map((name) => [name, value()?.[name]]),
    ),
  )
  const hasExtensions = computed<boolean>(
    () => customExtensions.value.length > 0 || Object.keys(defaultExtensions.value).length > 0,
  )
  return { customExtensions, defaultExtensions, hasExtensions }
}
