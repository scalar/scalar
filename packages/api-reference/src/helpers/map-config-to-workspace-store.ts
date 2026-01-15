import { isClient } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { useSeoMeta } from '@unhead/vue'
import { useFavicon } from '@vueuse/core'
import { type MaybeRefOrGetter, type Ref, computed, toValue, watch } from 'vue'

export const mapConfigToWorkspaceStore = ({
  config,
  store,
  isDarkMode,
}: {
  config: MaybeRefOrGetter<ApiReferenceConfigurationRaw>
  store: WorkspaceStore
  isDarkMode: Ref<boolean>
}) => {
  // Update the workspace store if default client changes
  watch(
    () => toValue(config).defaultHttpClient,
    (newValue) => {
      if (newValue) {
        const { targetKey, clientKey } = newValue

        const clientId = `${targetKey}/${clientKey}`
        if (isClient(clientId)) {
          store.update('x-scalar-default-client', clientId)
        }
      }
    },
    { immediate: true },
  )

  /** Update the dark mode state when props change */
  watch(
    () => toValue(config).darkMode,
    (isDark) => store.update('x-scalar-color-mode', isDark ? 'dark' : 'light'),
  )

  // Temporary mapping of isDarkMode until we update the standalone component
  watch(
    () => isDarkMode.value,
    (newIsDark) => store.update('x-scalar-color-mode', newIsDark ? 'dark' : 'light'),
    { immediate: true },
  )

  if (toValue(config).metaData) {
    useSeoMeta(toValue(config).metaData)
  }

  // Update the active proxy when the proxyUrl changes
  watch(
    () => toValue(config).proxyUrl,
    (newProxyUrl) => store.update('x-scalar-active-proxy', newProxyUrl),
    { immediate: true },
  )

  const favicon = computed(() => toValue(config).favicon)
  useFavicon(favicon)
}
