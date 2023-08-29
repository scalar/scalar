import '@scalar/api-client/style.css'
import { createApp } from 'vue'

import '../../theme/scrollbar.css'
import StandaloneApiReference from './components/StandaloneApiReference.vue'

createApp(StandaloneApiReference).mount('[data-spec-url]')
