import { isClient } from '@scalar/api-client/v2/blocks/operation-code-sample'
import { REFERENCE_LS_KEYS, safeLocalStorage } from '@scalar/helpers/object/local-storage'
import type { ApiReferenceConfigurationRaw } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { useSeoMeta } from '@unhead/vue'
import { useFavicon } from '@vueuse/core'
import { type MaybeRefOrGetter, type Ref, computed, onBeforeMount, toValue, watch } from 'vue'

export const mapConfigToWorkspaceStore = ({
  config,
  store,
  isDarkMode,
}: {
  config: MaybeRefOrGetter<ApiReferenceConfigurationRaw>
  store: WorkspaceStore
  isDarkMode: Ref<boolean>
}) => {
  // Do this a bit quicker than onMounted
  onBeforeMount(() => {
    const storedClient = safeLocalStorage().getItem(REFERENCE_LS_KEYS.SELECTED_CLIENT)
    if (isClient(storedClient) && !store.workspace['x-scalar-default-client']) {
      store.update('x-scalar-default-client', storedClient)
    }
  })

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
    (isDark) => store.update('x-scalar-dark-mode', !!isDark),
  )

  // Temporary mapping of isDarkMode until we update the standalone component
  watch(
    () => isDarkMode.value,
    (newValue) => store.update('x-scalar-dark-mode', newValue),
    { immediate: true },
  )

  if (toValue(config).metaData) {
    useSeoMeta(toValue(config).metaData)
  }

  const favicon = computed(() => toValue(config).favicon)
  useFavicon(favicon)
}
