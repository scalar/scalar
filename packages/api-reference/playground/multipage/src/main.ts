// TODO: Remove
import '@scalar/components/style.css'
import '@scalar/themes/style.css'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import Home from './Home.vue'
import { ScalarApiReference, routesAsChildren } from './package'

/** Simulate a main app with an existing router, using just our component */
const WITH_ROUTING = true
/** Configure to render a onepager or a separate page for every operation */
const PAGES: 'single' | 'multi' = 'multi'

const app = createApp(
  WITH_ROUTING ? App : ScalarApiReference,
  WITH_ROUTING
    ? {}
    : {
        pages: PAGES,
        history: createWebHistory(),
      },
)

if (WITH_ROUTING) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        name: 'home',
        component: Home,
      },
      {
        path: '/scalar',
        name: 'scalar',
        component: ScalarApiReference,
        props: {
          pages: PAGES,
        },
        children: routesAsChildren,
      },
    ],
  })

  app.use(router)
}

app.mount('#app')
