import './style.css'
import { createApp } from 'vue'
import ApiClientPage from './pages/ApiClientPage.vue'
import ApiReferencePage from './pages/ApiReferencePage.vue'
import StartPage from './pages/StartPage.vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: StartPage },
  { path: '/api-client', name: 'api-client', component: ApiClientPage },
  { path: '/api-reference', name: 'api-reference', component: ApiReferencePage }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

createApp(App)
  .use(router)
  .mount('#app')
