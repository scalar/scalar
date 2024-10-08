// TODO: Remove CSS imports eventually
import '@scalar/components/style.css'
import '@scalar/themes/style.css'
import { createSSRApp } from 'vue'

import App from './App.vue'
// import Home from './Home.vue'
import { ScalarApiReference } from './package'
import { registerRouter } from './package/utils/registerRouter'

/** Simulate a main app with an existing router, using just our component */
const WITH_ROUTING = false
/** Configure to render a onepager or a separate page for every operation */
const PAGES: 'single' | 'multi' = 'multi'

/** Create Vue SSR app */
export function createApp() {
  const app = createSSRApp(WITH_ROUTING ? App : ScalarApiReference, {
    props: {
      pages: PAGES,
    },
  })

  const router = registerRouter()

  app.use(router)

  return app
}
