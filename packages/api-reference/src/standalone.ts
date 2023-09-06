import { createApp } from 'vue'

import '../../theme/scrollbar.css'
import ApiReference from './components/ApiReference.vue'

const specElement = document.querySelector('[data-spec]')
const specUrlElement = document.querySelector('[data-spec-url]')

if (!specUrlElement && !specElement) {
  console.error(
    'Couldn’t find a [data-spec] or [data-spec-url] element. Try adding it like this: %c<div data-spec-url="https://petstore.swagger.io/v2/swagger.json" />',
    'font-family: monospace;',
  )
} else {
  const properties = specElement
    ? {
        spec: specElement.getAttribute('data-spec'),
      }
    : {
        specUrl: specUrlElement?.getAttribute('data-spec-url') ?? '',
      }

  document.querySelector('body')?.classList.add('light-mode')

  const container = specElement ? '[data-spec]' : '[data-spec-url]'

  createApp(ApiReference, properties).mount(container)
}
