<script lang="ts" setup>
import { type ComponentInternalInstance, getCurrentInstance } from 'vue'
import {
  type RouteRecordRaw,
  type RouterHistory,
  createRouter,
  createWebHistory,
} from 'vue-router'

import { routes } from '../routes'

const props = withDefaults(
  defineProps<{
    pages?: 'single' | 'multi'
    routePrefix?: string
    history?: RouterHistory
  }>(),
  {
    pages: 'single',
  },
)

// Register the router with the app
const app = getCurrentInstance()

const router = getOrCreateRouter(app)

function getOrCreateRouter(instance: ComponentInternalInstance | null) {
  // Check if the app already has a router
  if (instance?.proxy?.$router) {
    // Add the routes to it
    const existingRouter = instance.proxy.$router

    addRoutePrefix(routes, props.routePrefix).forEach((route) => {
      if (route.name && !existingRouter.hasRoute(route.name)) {
        existingRouter.addRoute(route)
      }
    })

    return existingRouter
  }

  // If no router exists, create a new one
  const newRouter = createRouter({
    history: props.history ?? createWebHistory(),
    routes: addRoutePrefix(routes, props.routePrefix),
  })

  if (instance) {
    instance.appContext.app.use(newRouter)
  } else {
    console.error('Failed to get current instance. Router not registered.')
  }

  return newRouter
}

/**
 * Add a prefix to all routes
 */
function addRoutePrefix(
  originalRoutes: RouteRecordRaw[],
  prefix?: string,
): RouteRecordRaw[] {
  if (!prefix) {
    return originalRoutes
  }

  return [
    {
      path: prefix,
      children: originalRoutes.map((route) => ({
        ...route,
        // Remove leading slash from the path if it exists,
        // otherwise it’ll be added to the root
        path: route.path.startsWith('/') ? route.path.slice(1) : route.path,
      })),
    },
  ]
}

/**
 * Hook into the router to scroll instead of changing the views
 */
router.beforeEach((to, from, next) => {
  // No need to hook into the router if we have multiple pages
  if (props.pages === 'multi') {
    next()
  }

  // Scroll to the target element
  const targetId = to.name

  if (typeof targetId !== 'string') {
    console.error(`[router.beforeEach] route doesn’t have a name`, to)
    return
  }

  const targetElement = document.getElementById(targetId)

  if (targetElement) {
    targetElement.scrollIntoView({ behavior: 'smooth' })
    next()
  } else {
    // If the target element doesn't exist, allow the navigation
    next()
  }
})
</script>
<template>
  <slot />
</template>
