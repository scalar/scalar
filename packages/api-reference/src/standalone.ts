import { createApp } from 'vue'

import { default as ApiReference } from './components/ApiReference.vue'

const specScriptTag = document.querySelector('#api-reference')
const specElement = document.querySelector('[data-spec]')
const specUrlElement = document.querySelector('[data-spec-url]')

const getSpecUrl = () => {
  // <script id="api-reference" data-url="/scalar.json" />
  if (specScriptTag) {
    const urlFromScriptTag = specScriptTag.getAttribute('data-url')

    if (urlFromScriptTag) {
      return urlFromScriptTag
    }
  }

  // <div data-spec-url="/scalar.json" />
  if (specUrlElement) {
    const urlFromSpecUrlElement = specUrlElement.getAttribute('data-spec-url')

    if (urlFromSpecUrlElement) {
      return urlFromSpecUrlElement
    }
  }

  return null
}

const getSpec = () => {
  // <script id="api-reference" type="application/json">{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}</script>
  if (specScriptTag) {
    const specFromScriptTag = specScriptTag.innerHTML

    if (specFromScriptTag) {
      return specFromScriptTag
    }
  }

  // <div data-spec='{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}' />
  if (specElement) {
    const specFromSpecElement = specElement.getAttribute('data-spec')

    if (specFromSpecElement) {
      return specFromSpecElement
    }
  }

  return null
}

if (!specUrlElement && !specElement && !specScriptTag) {
  console.error(
    'Couldn’t find a [data-spec], [data-spec-url] or <script id="api-reference" /> element. Try adding it like this: %c<div data-spec-url="https://petstore.swagger.io/v2/swagger.json" />',
    'font-family: monospace;',
  )
} else {
  const properties = getSpec()
    ? {
        spec: getSpec(),
      }
    : {
        specUrl: getSpecUrl(),
      }

  console.log(properties)

  document.querySelector('body')?.classList.add('light-mode')

  const container = specScriptTag
    ? '#api-reference'
    : specElement
    ? '[data-spec]'
    : specUrlElement
    ? '[data-spec-url]'
    : 'body'

  createApp(ApiReference, properties).mount(container)
}
