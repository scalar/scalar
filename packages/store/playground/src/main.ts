import { createApp } from 'vue'
import App from './App.vue'

import { createRouter, createWebHistory } from 'vue-router'
import CircularReference from './pages/CircularReference.vue'
import Dereference from './pages/Dereference.vue'
import Root from './pages/Root.vue'

const routes = [
  { path: '/', component: Root, name: 'root' },
  { path: '/circular-reference', component: CircularReference, name: 'circular-reference' },
  { path: '/dereference', component: Dereference, name: 'dereference' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const app = createApp(App).use(router)

app.mount('#app')
