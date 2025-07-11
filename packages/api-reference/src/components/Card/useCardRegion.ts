import { inject, provide, ref, type InjectionKey, type Ref } from 'vue'

/**
 * Tracks the region heading id
 */
export const CARD_REGION_SYMBOL = Symbol() as InjectionKey<Ref<string | undefined>>

/**
 * Set the region heading id
 */
export const useCardRegionHeading = (id: string) => {
  const region = inject(CARD_REGION_SYMBOL)
  if (region) {
    region.value = id
  }
}

/** Get the region heading id if set */
export const useCardRegion = () => {
  // Create a new ref for any child nested items to update
  const id = ref<string>()
  provide(CARD_REGION_SYMBOL, id)

  return {
    /** The region heading id ref */
    id,
  }
}
