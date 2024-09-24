import type { Ref } from 'vue'

import { measure } from './measure'

/**
 * Update the state after something is done
 */
export async function pending<T = any>(
  {
    state,
    before,
    after,
    debug,
  }: {
    state: Ref<T>
    before: T
    after: T
    debug?: string | undefined
  },
  callback: () => void | Promise<void>,
) {
  state.value = before

  try {
    // Output the time it takes
    if (debug) {
      await measure(debug, async () => {
        await callback()
      })
    }
    // Just run it
    else {
      await callback()
    }

    state.value = after
  } catch (error: any) {
    state.value = after

    throw error
  }
}
