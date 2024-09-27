<script lang="ts" setup>
import type { RouterHistory } from 'vue-router'

import { ROUTE_NAMES, type RouteName } from '../../routes'
import { getOrCreateRouter } from './utils/getOrCreateRouter'

const props = withDefaults(
  defineProps<{
    pages?: 'single' | 'multi'
    history?: RouterHistory
  }>(),
  {
    pages: 'single',
  },
)

const router = getOrCreateRouter({
  history: props.history,
})

/**
 * Hook into the router to scroll instead of changing the views
 */
router.afterEach((route) => {
  // No need to hook into the router if it’s not our route
  if (route.meta?.scalar !== true) {
    return
  }

  // Redirect if the route is invalid
  const targetRouteName = route.name

  if (
    typeof targetRouteName === 'string' &&
    !Object.values(ROUTE_NAMES).includes(targetRouteName as RouteName)
  ) {
    const firstRoute = Object.values(ROUTE_NAMES)[0]
    router.replace({ name: firstRoute })
    return
  }

  // No need to hook into the router if we have multiple pages,
  if (props.pages === 'multi') {
    return
  }

  // Scroll to the target element
  const targetId = route.name

  if (typeof targetId !== 'string') {
    console.error(`[router.beforeEach] Route doesn’t have a name:`, route)
    return
  }

  const targetElement = document.getElementById(targetId)

  if (!targetElement) {
    console.error('[router.beforeEach] Can’t find the ID:', targetId)
    return
  }

  targetElement.scrollIntoView({ behavior: 'smooth' })
})
</script>
<template>
  <slot />
</template>
