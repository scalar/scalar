// TODO: Remove
import '@scalar/components/style.css'
import '@scalar/themes/style.css'
import { createApp } from 'vue'
import { createWebHashHistory } from 'vue-router'

// import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'

// import { routes } from './routes'

const app = createApp(App, {
  pages: 'single',
  routePrefix: '/scalar',
  history: createWebHashHistory(),
})

// const router = createRouter({
//   history: createWebHashHistory(),
//   routes: [],
// })

// app.use(router)

app.mount('#app')
