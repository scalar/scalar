import type { AvailableClients } from '@scalar/snippetz'
import { reactive } from 'vue'

/**
 * A global store for shared block data
 *
 * Later we can also use it to keep selected examples or content-type synced across operation blocks
 *
 * @example keeps the http client synced across all blocks
 */
export const blockStore = reactive({
  selectedClient: null as AvailableClients[number] | null,
})
