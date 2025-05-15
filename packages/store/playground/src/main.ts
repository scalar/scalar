import { createApp } from 'vue'
import App from './App.vue'

import { createRouter, createWebHistory } from 'vue-router'
import CircularReference from './pages/CircularReference.vue'
import CreateCollection from './pages/CreateCollection.vue'
import Dereference from './pages/Dereference.vue'
import ExternalReferences from './pages/ExternalReferences.vue'

const routes = [
  { path: '/', component: Dereference, name: 'dereference' },
  { path: '/create-collection', component: CreateCollection, name: 'create-collection' },
  { path: '/external-references', component: ExternalReferences, name: 'external-references' },
  { path: '/circular-reference', component: CircularReference, name: 'circular-reference' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const app = createApp(App).use(router)

app.mount('#app')
