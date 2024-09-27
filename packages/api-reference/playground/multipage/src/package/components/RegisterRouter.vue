<script lang="ts" setup>
import { getCurrentInstance } from 'vue'
import { type RouterHistory, createRouter, createWebHistory } from 'vue-router'

import { routes } from '../routes'

const props = withDefaults(
  defineProps<{
    pages?: 'single' | 'multi'
    history?: RouterHistory
  }>(),
  {
    pages: 'single',
  },
)

const router = getOrCreateRouter()

/**
 * Retrieve the router from the Vue app instance or create and register a new one
 */
function getOrCreateRouter() {
  const instance = getCurrentInstance()

  // Check if the app already has a router
  if (instance?.proxy?.$router) {
    return instance.proxy.$router
  }

  // If no router exists, create a new one
  const newRouter = createRouter({
    history: props.history ?? createWebHistory(),
    routes: routes,
  })

  if (instance) {
    instance.appContext.app.use(newRouter)
  } else {
    console.error('Failed to get current instance. Router not registered.')
  }

  return newRouter
}

/**
 * Hook into the router to scroll instead of changing the views
 */
router.beforeEach((to, from, next) => {
  // No need to hook into the router if we have multiple pages
  if (props.pages === 'multi' || to.meta?.fromScalar !== true) {
    next()
    return
  }

  // Scroll to the target element
  const targetId = to.name

  if (typeof targetId !== 'string') {
    console.error(`[router.beforeEach] Route doesn’t have a name.`, to)
    return
  }

  const targetElement = document.getElementById(targetId)

  if (!targetElement) {
    console.error('[router.beforeEach] Can’t find the ID.', targetId)
    return
  }

  targetElement.scrollIntoView({ behavior: 'smooth' })

  next()
})
</script>
<template>
  <slot />
</template>
