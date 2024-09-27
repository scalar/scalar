// TODO: Remove CSS imports eventually
import '@scalar/components/style.css'
import '@scalar/themes/style.css'
import { ViteSSG } from 'vite-ssg'

import App from './App.vue'
import Home from './Home.vue'
import { ScalarApiReference, routes, routesAsChildren } from './package'

/** Simulate a main app with an existing router, using just our component */
const WITH_ROUTING = false
/** Configure to render a onepager or a separate page for every operation */
const PAGES: 'single' | 'multi' = 'multi'

export const createApp = ViteSSG(
  // the root component
  WITH_ROUTING ? App : ScalarApiReference,
  // vue-router options
  {
    routes: WITH_ROUTING
      ? [
          {
            path: '/home',
            name: 'home',
            component: Home,
          },
          {
            path: '/',
            // We need this to route to a generic entrypoint `to: { name: 'scalar' }`
            name: 'scalar',
            component: ScalarApiReference,
            props: {
              // Render a onepager or separate pages
              pages: PAGES,
            },
            meta: {
              // Otherwise we won’t hook into the routing
              scalar: true,
            },
            // All routes without a leading slash
            children: routesAsChildren,
          },
        ]
      : routes,
  },
  //   // function to have custom setups
  //   ({ app, router, routes, isClient, initialState }) => {
  //     // install plugins etc.
  //   },
)
