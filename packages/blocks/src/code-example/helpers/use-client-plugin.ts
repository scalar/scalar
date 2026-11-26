import { getLoadedPlugin, hasPlugin, loadPlugin } from '@scalar/snippetz/lazy'
import { type ComputedRef, type MaybeRefOrGetter, computed, onServerPrefetch, ref, toValue, watch } from 'vue'

/** Split a `target/client` id into its target and client. */
const splitClientId = (clientId: string): [string, string] => {
  const [target = '', client = ''] = clientId.split('/')
  return [target, client]
}

/**
 * Whether a client still needs its generator. Custom code samples, unknown ids and already loaded
 * plugins need nothing, so they never wait.
 */
const needsPlugin = (clientId: string | undefined): clientId is string => {
  if (!clientId) {
    return false
  }
  const [target, client] = splitClientId(clientId)
  return hasPlugin(target, client) && !getLoadedPlugin(target, client)
}

/**
 * Load the code generator of the selected client on demand.
 *
 * Generators live in their own chunks (see `@scalar/snippetz/lazy`), so a page only downloads the
 * clients it shows. While the selected client's generator loads, `isLoading` is true and the caller
 * should render a placeholder instead of calling `generateCodeSnippet`.
 *
 * On the server, the component waits for the generator in `onServerPrefetch`, so the markup contains the
 * final snippet. Hosts await `preloadClients([selectedClient])` before hydrating, so the browser's first
 * render matches that markup. Without the preload, `CodeExample` keeps the server-rendered snippet in
 * its placeholder until the generator arrives.
 *
 * @param clientId - The selected client id, for example `shell/curl` or `custom/python`
 */
export const useClientPlugin = (
  clientId: MaybeRefOrGetter<string | undefined>,
): {
  /** Whether the selected client's generator is still loading */
  isLoading: ComputedRef<boolean>
  /** Whether the last load of the selected client's generator failed */
  isFailed: ComputedRef<boolean>
  /** Load the selected client's generator again, after a failure */
  retry: () => void
} => {
  /** The plugin cache is not reactive, so we count settled loads to re-evaluate `isLoading` */
  const settledLoads = ref(0)
  /** A client whose last load failed: we stop waiting so the snippet area shows an error, not a placeholder */
  const failedClientId = ref<string>()

  const load = (id: string): Promise<void> => {
    if (failedClientId.value === id) {
      failedClientId.value = undefined
    }
    const [target, client] = splitClientId(id)

    return loadPlugin(target, client)
      .then(
        () => undefined,
        (error: unknown) => {
          console.error('[useClientPlugin] Failed to load the code generator', error)
          // Selecting the client again, or `retry`, loads it again, because the failed import is not cached
          if (toValue(clientId) === id) {
            failedClientId.value = id
          }
        },
      )
      .finally(() => {
        settledLoads.value++
      })
  }

  const isLoading = computed(() => {
    // Track settled loads, the check below reads a non-reactive cache
    void settledLoads.value
    const id = toValue(clientId)
    return needsPlugin(id) && failedClientId.value !== id
  })

  const isFailed = computed(() => {
    const id = toValue(clientId)
    return id !== undefined && failedClientId.value === id
  })

  /** Failed imports are not cached, so loading again makes a fresh request */
  const retry = (): void => {
    const id = toValue(clientId)
    if (needsPlugin(id)) {
      void load(id)
    }
  }

  watch(
    () => toValue(clientId),
    (id) => {
      if (needsPlugin(id)) {
        void load(id)
      }
    },
    { immediate: true },
  )

  // Render the final snippet on the server instead of the placeholder
  onServerPrefetch(() => {
    const id = toValue(clientId)
    return needsPlugin(id) ? load(id) : undefined
  })

  return { isLoading, isFailed, retry }
}
