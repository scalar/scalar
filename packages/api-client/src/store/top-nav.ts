import type { StoreContext } from '@/store/store-context'
import { LS_KEYS } from '@scalar/oas-utils/helpers'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { nanoid } from 'nanoid'
import { reactive, ref } from 'vue'
import type { RouteLocation } from 'vue-router'

export type TopNavRoute = RouteLocation

export type TopNavItemStore = {
  uid: string
  route: TopNavRoute | null
}

/** Create storage objects for top nav items */
export function createTopNavStore(useLocalStorage: boolean) {
  /**
   * Init top nav store with a default item.
   */
  const itemUid = nanoid()

  /**
   * Use existing mutator only for nav items.
   *
   * Storing nav state as an array of items alongside
   * a separate active index is a better data structure
   * to determine item positioning.
   */
  const topNavItems = reactive<Record<string, TopNavItemStore>>({})
  const topNavItemMutator = mutationFactory(topNavItems, reactive({}), useLocalStorage && LS_KEYS.TOP_NAV)

  /**
   * Add initial nav item
   */
  topNavItemMutator.add({ uid: itemUid, route: null })

  /**
   * List of items in workspace (tabs)
   */
  const navState = reactive<string[]>([itemUid])

  /**
   * Active nav item
   */
  const activeItemIdx = ref(0)

  return {
    topNav: {
      items: topNavItems,
      navState,
      activeItemIdx,
    },
    topNavItemMutator,
  }
}

/** Extended mutators and data for servers */
export function extendedTopNavDataFactory({ topNav, topNavItemMutator }: StoreContext) {
  /**
   * Add a new nav item by appending it
   * to the end of the items array. Optionally
   * set the new item as the active one.
   */
  const addTopNavItem = (options: Partial<TopNavItemStore>, setAsActive: boolean = true) => {
    const newNavItem: TopNavItemStore = {
      uid: options.uid || nanoid(),
      route: options.route || null,
    }

    /**
     * Add new nav item to the mutator items map.
     */
    topNavItemMutator.add(newNavItem)

    /**
     * Append new nav item UID at then end of the list.
     */
    topNav.navState.push(newNavItem.uid)

    /**
     * Update active item.
     */
    if (setAsActive) topNav.activeItemIdx.value = topNav.navState.length - 1

    return newNavItem
  }

  /** Set active nav item */
  const setActiveTopNavItem = (itemIdx: number) => {
    const { matchingNavState, matchingItem } = getTopNavItem(itemIdx)
    if (!matchingNavState || !matchingItem) return console.error('[TOP_NAV MUTATORS]: Unable to find matching item.')

    topNav.activeItemIdx.value = itemIdx
  }

  /**
   * Retrieve top nav item from state idx. Defaults
   * to active item index.
   */
  function getTopNavItem(itemIdx?: number) {
    /**
     * Find item UID from nav state
     */
    const matchingNavState = topNav.navState[itemIdx ?? topNav.activeItemIdx.value]
    if (!matchingNavState) return {}

    /**
     * Find matching item data from store
     */
    const matchingItem = topNav.items[matchingNavState]
    if (!matchingItem) return { matchingNavState }

    return {
      matchingItem,
      matchingNavState,
    }
  }

  /**
   * Update top nav item from state idx. Defaults
   * to active item index.
   */
  const updateTopNavItem = (item: Omit<TopNavItemStore, 'uid'>, itemIdx?: number) => {
    const { matchingItem } = getTopNavItem(itemIdx)
    if (!matchingItem) return console.error('[TOP_NAV MUTATORS]: Unable to find matching item.')

    topNavItemMutator.set({
      ...matchingItem,
      ...item,
    })
  }

  /** Delete a nav item */
  const deleteTopNavItem = (itemIdx: number) => {
    const { matchingNavState, matchingItem } = getTopNavItem(itemIdx)
    if (!matchingNavState || !matchingItem) return console.error('[TOP_NAV MUTATORS]: Unable to find matching item.')

    /**
     * Top nav should always have one default item.
     */
    if (topNav.navState.length === 1) return console.error('[TOP_NAV_MUTATORS]: Cannot delete your only nav item.')

    const activeItemIdx = topNav.activeItemIdx.value

    /**
     * When the item index is greater than the current item index,
     * we need to shift it left.
     *
     * If it's equal and above 0, we also shift it to the
     * tab on the left.
     *
     * If it's below the current item index, it does not need
     * shifting and can remain the same.
     */
    const newNavStateIdx =
      activeItemIdx > itemIdx || (activeItemIdx === itemIdx && itemIdx > 0) ? activeItemIdx - 1 : activeItemIdx

    /**
     * Update the currently active item
     */
    topNav.activeItemIdx.value = newNavStateIdx

    /**
     * Remove item from nav state
     */
    topNav.navState.splice(itemIdx, 1)

    /**
     * Remove nav item from state
     */
    topNavItemMutator.delete(matchingNavState)
  }

  /**
   * Deletes all other items apart from the selected one.
   */
  const deleteOtherTopNavItems = (itemIdx: number) => {
    const { matchingNavState, matchingItem } = getTopNavItem(itemIdx)
    if (!matchingNavState || !matchingItem) return console.error('[TOP_NAV MUTATORS]: Unable to find matching item.')

    /**
     * Top nav should always have one default item.
     */
    if (topNav.navState.length === 1) return console.error('[TOP_NAV_MUTATORS]: Cannot delete your only nav item.')

    /**
     * Set new nav state to only required item.
     */
    topNav.navState = [matchingItem.uid]

    /**
     * Ensure the active nav item is set to the selected item.
     */
    topNav.activeItemIdx.value = 0

    /**
     * Delete any items that are no longer needed.
     */
    const itemsToDelete = Object.keys(topNav.items).filter((key) => key !== matchingNavState)
    itemsToDelete.forEach((item) => topNavItemMutator.delete(item))
  }

  return {
    getTopNavItem,
    addTopNavItem,
    updateTopNavItem,
    deleteTopNavItem,
    deleteOtherTopNavItems,
    setActiveTopNavItem,
  }
}
