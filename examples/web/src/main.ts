import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import ApiClientPage from './pages/ApiClientPage.vue'
import ApiReferencePage from './pages/ApiReferencePage.vue'
import StandaloneApiReferencePage from './pages/StandaloneApiReferencePage.vue'
import StartPage from './pages/StartPage.vue'
import SwaggerEditorPage from './pages/SwaggerEditorPage.vue'
import './style.css'

const routes = [
  { path: '/', name: 'home', component: StartPage },
  { path: '/api-client', name: 'api-client', component: ApiClientPage },
  {
    path: '/api-reference',
    name: 'api-reference',
    component: ApiReferencePage,
  },
  {
    path: '/standalone-api-reference',
    name: 'standalone-api-reference',
    component: StandaloneApiReferencePage,
  },
  {
    path: '/swagger-editor',
    name: 'swagger-editor',
    component: SwaggerEditorPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

createApp(App).use(router).mount('#app')
