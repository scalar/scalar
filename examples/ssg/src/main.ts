// src/main.ts
import { ViteSSG } from 'vite-ssg/single-page'

import App from './App.vue'

// `export const createApp` is required instead of the original `createApp(App).mount('#app')`
export const createApp = ViteSSG(App)
