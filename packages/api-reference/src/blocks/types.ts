import type { StoreContext } from '@/blocks/lib/createStore'

export type BlockProps = {
  store: StoreContext
  location: string
  // TODO: Allow to pick a collection
  // TODO: Add collection prop
}
