import { createSSRApp } from 'vue'

import App from '../../src/App.vue'
import Home from '../../src/components/Home.vue'
import { ScalarApiReference, routes as scalarRoutes } from '../../src/package'
import { createRouter } from './router'

/** Simulate a main app with an existing router, using just our component */
const WITH_ROUTING = false
/** Configure to render a onepager or a separate page for every operation */
const PAGES: 'single' | 'multi' = 'multi'

const routes = WITH_ROUTING
  ? [
      {
        path: '/home',
        name: 'home',
        component: Home,
      },
    ]
  : scalarRoutes

// SSR requires a fresh app instance per request, therefore we export a function
// that creates a fresh app instance. If using Vuex, we'd also be creating a
// fresh store here.
export function createApp() {
  const app = createSSRApp(
    WITH_ROUTING ? App : ScalarApiReference,
    WITH_ROUTING
      ? {}
      : {
          pages: PAGES,
        },
  )
  const router = createRouter(routes)
  app.use(router)
  return { app, router }
}
