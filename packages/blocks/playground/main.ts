import '../src/style.css'
import './style.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import ApiReferenceLight from './pages/ApiReferenceLight.vue'
import CodeExampleBlocks from './pages/CodeExampleBlocks.vue'
import SchemaBlocks from './pages/SchemaBlocks.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'code-example-blocks', component: CodeExampleBlocks },
    { path: '/schema', name: 'schema-blocks', component: SchemaBlocks },
    { path: '/api-reference-light', name: 'api-reference-light', component: ApiReferenceLight },
  ],
})

createApp(App).use(router).mount('#app')
