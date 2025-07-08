import type { AvailableClients } from '@scalar/snippetz'
import { safeLocalStorage } from '@scalar/helpers/object/local-storage'
import { LS_CONFIG, debounce } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

type BlockStoreState = {
  selectedClient: AvailableClients[number] | null
}

/** The base global state of the block store */
const state = reactive<BlockStoreState>({
  selectedClient: null,
})

/** Local storage key for the block store */
export const BLOCK_STORE_LS_KEY = 'scalar-blocks-state'

/** Keeps track of whether the block store has been restored from localStorage */
let restored = false

/** Debounced function to save the block state to localStorage */
const debouncedSaveState = debounce(
  () => safeLocalStorage().setItem(BLOCK_STORE_LS_KEY, JSON.stringify(state)),
  LS_CONFIG.DEBOUNCE_MS,
  {
    maxWait: LS_CONFIG.MAX_WAIT_MS,
  },
)

/**
 * A global store for shared block data
 *
 * Later we can also use it to keep selected examples or content-type synced across operation blocks
 *
 * @example keeps the http client synced across all blocks
 */
export const blockStore = {
  /** Returns the key that you are grabbing or the whole state if one isn't provided */
  getState: ((key) => (key ? state[key] : state)) as {
    (): Readonly<BlockStoreState>
    <K extends keyof BlockStoreState>(key: K): Readonly<BlockStoreState[K]>
  },
  /** Set the state of the block store */
  setState: (key: keyof BlockStoreState, value: BlockStoreState[keyof BlockStoreState]) => {
    state[key] = value
    debouncedSaveState()
  },
  /**
   * Restore the block state from localStorage
   * Must be called on the client in the `onMounted` hook
   */
  restoreState: () => {
    try {
      if (restored) {
        return
      }

      const storedState = safeLocalStorage().getItem(BLOCK_STORE_LS_KEY)
      if (storedState) {
        Object.assign(state, JSON.parse(storedState))
        restored = true
      }
    } catch (error) {
      console.error('[openapi-blocks] Error restoring block state from localStorage', error)
    }
  },

  /**
   * Reset the restored flag for testing purposes
   * @internal
   */
  _resetRestored: () => {
    restored = false
  },
}
