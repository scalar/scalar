import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import ApiClientPage from './pages/ApiClientPage.vue'
import ApiReferenceEditorPage from './pages/ApiReferenceEditorPage.vue'
import ApiReferencePage from './pages/ApiReferencePage.vue'
import ClassicApiReferencePage from './pages/ClassicApiReferencePage.vue'
import EmbeddedApiReferencePage from './pages/EmbeddedApiReferencePage.vue'
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
    path: '/classic-api-reference',
    name: 'classic-api-reference',
    component: ClassicApiReferencePage,
  },
  {
    path: '/embedded-api-reference',
    name: 'embedded-api-reference',
    component: EmbeddedApiReferencePage,
  },
  {
    path: '/api-reference-editor',
    name: 'api-reference-editor',
    component: ApiReferenceEditorPage,
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
