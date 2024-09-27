import { getCurrentInstance } from 'vue'
import { type RouterHistory, createRouter, createWebHistory } from 'vue-router'

import { routes } from '../routes'

/**
 * Retrieve the router from the Vue app instance or create and register a new one
 */
export function getOrCreateRouter({
  history,
}: {
  history?: RouterHistory
} = {}) {
  const instance = getCurrentInstance()

  // Check if the app already has a router
  if (instance?.proxy?.$router) {
    return instance.proxy.$router
  }

  // If no router exists, create a new one
  const newRouter = createRouter({
    history: history ?? createWebHistory(),
    routes: routes,
  })

  if (instance) {
    instance.appContext.app.use(newRouter)
  } else {
    console.error(
      '[getOrCreateRouter] Failed to get current Vue instance. Router not registered.',
    )
  }

  return newRouter
}
