import { ApiReference } from '@scalar/api-reference'
import { createApp } from 'vue'

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
    console.warn(
      '[@scalar/api-reference] The [data-spec-url] HTML API is deprecated. Use the new <script id="api-reference" data-url="/scalar.json" /> API instead.',
    )
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
      return specFromScriptTag.trim()
    }
  }

  // <div data-spec='{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}' />
  if (specElement) {
    console.warn(
      '[@scalar/api-reference] The [data-spec] HTML API is deprecated. Use the new <script id="api-reference" type="application/json">{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}</script> API instead.',
    )
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

  document.querySelector('body')?.classList.add('light-mode')

  // If it’s a script tag, we can’t mount the Vue.js app inside that tag.
  // We need to add a new container div before the script tag.
  if (specScriptTag) {
    const container = document.createElement('div')

    specScriptTag?.parentNode?.insertBefore(container, specScriptTag)

    createApp(ApiReference, properties).mount(container)
  } else {
    const container = specElement
      ? '[data-spec]'
      : specUrlElement
      ? '[data-spec-url]'
      : 'body'

    createApp(ApiReference, properties).mount(container)
  }
}
