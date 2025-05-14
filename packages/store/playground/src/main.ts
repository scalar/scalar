import { createApp } from 'vue'
import App from './App.vue'

import { createRouter, createWebHistory } from 'vue-router'
import CircularReference from './pages/CircularReference.vue'
import Root from './pages/Root.vue'

const routes = [
  { path: '/', component: Root, name: 'root' },
  { path: '/circular-reference', component: CircularReference, name: 'circular-reference' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const app = createApp(App).use(router)

app.mount('#app')
