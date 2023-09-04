import { createApp } from 'vue'

import '../../theme/scrollbar.css'
import ApiReference from './components/ApiReference.vue'

if (!document.querySelector('[data-spec-url]')) {
  console.error(
    'Couldn’t find a [data-spec-url] element. Try adding it like this: %c<div data-spec-url="https://petstore.swagger.io/v2/swagger.json" />',
    'font-family: monospace;',
  )
} else {
  createApp(ApiReference, {
    specUrl:
      document
        .querySelector('[data-spec-url]')
        ?.getAttribute('data-spec-url') || '',
  }).mount('[data-spec-url]')
}
