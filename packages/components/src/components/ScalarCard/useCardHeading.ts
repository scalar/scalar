import { type InjectionKey, type Ref, inject, provide, ref } from 'vue'

/**
 * Tracks the region heading id for card accessibility
 */
const CARD_Heading_SYMBOL: InjectionKey<Ref<string | undefined>> = Symbol()

/**
 * Set the region heading id for a ScalarCardHeader component.
 *
 * This should be called from ScalarCardHeader components.
 */
export const useCardHeading = (id: string) => {
  const region = inject(CARD_Heading_SYMBOL, undefined)
  if (region) {
    region.value = id
  }
}

/**
 * Get the region heading id if set.
 *
 * This should be called from ScalarCard components.
 */
export const useCardRegion = () => {
  // Create a new ref for any child nested items to update
  const id = ref<string>()
  provide(CARD_Heading_SYMBOL, id)

  return {
    /** The region heading id ref */
    id,
  }
}
