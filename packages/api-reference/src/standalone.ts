import '@scalar/api-client/style.css'
import { createApp } from 'vue'

import '../../theme/scrollbar.css'
import StandaloneApiReference from './components/StandaloneApiReference.vue'

if (!document.querySelector('[data-spec-url]')) {
  console.error(
    'Couldn’t find a [data-spec-url] element. Try adding it like this: %c<div data-spec-url="https://petstore.swagger.io/v2/swagger.json" />',
    'font-family: monospace;',
  )
} else {
  createApp(StandaloneApiReference).mount('[data-spec-url]')
}
