/**
 * This file is the entry point for the CDN version of the API Reference.
 * It’s responsible for finding the spec and configuration in the HTML, and mounting the Vue.js app.
 */
import { createApp, h, reactive } from 'vue'

import { default as ApiReference } from './components/ApiReference.vue'
import type { ReferenceConfiguration } from './types'

const specScriptTag = document.getElementById('api-reference')
const specElement = document.querySelector('[data-spec]')
const specUrlElement = document.querySelector('[data-spec-url]')
const configurationScriptElement = document.querySelector(
  '#api-reference[data-configuration]',
)

const getConfiguration = (): ReferenceConfiguration => {
  // <script data-configuration="{ … }" />
  if (configurationScriptElement) {
    const configurationFromElement =
      configurationScriptElement.getAttribute('data-configuration')

    if (configurationFromElement) {
      return JSON.parse(configurationFromElement.split('&quot;').join('"'))
    }
  }

  return {}
}

const getSpecUrl = () => {
  // Let’s first check if the user passed a spec URL in the configuration.
  if (getConfiguration().spec?.url) {
    return getConfiguration().spec?.url
  }

  // <script id="api-reference" data-url="/scalar.json" />
  if (specScriptTag) {
    const urlFromScriptTag = specScriptTag.getAttribute('data-url')?.trim()

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

  return undefined
}

const getSpec = (): Record<string, any> | undefined => {
  // <script id="api-reference" type="application/json">{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}</script>
  if (specScriptTag) {
    const specFromScriptTag = specScriptTag.innerHTML?.trim()

    if (specFromScriptTag) {
      return JSON.parse(specFromScriptTag)
    }
  }

  // <div data-spec='{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}' />
  if (specElement) {
    console.warn(
      '[@scalar/api-reference] The [data-spec] HTML API is deprecated. Use the new <script id="api-reference" type="application/json">{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}</script> API instead.',
    )
    const specFromSpecElement = specElement.getAttribute('data-spec')?.trim()

    if (specFromSpecElement) {
      return JSON.parse(specFromSpecElement)
    }
  }

  return undefined
}

const getProxyUrl = () => {
  // <script id="api-reference" data-proxy-url="https://api.scalar.com/request-proxy">…</script>
  if (specScriptTag) {
    const proxyUrl = specScriptTag.getAttribute('data-proxy-url')

    if (proxyUrl) {
      return proxyUrl.trim()
    }
  }

  return undefined
}

// Ensure Reference Props are reactive
const props = reactive({})

if (!specUrlElement && !specElement && !specScriptTag) {
  console.error(
    'Couldn’t find a [data-spec], [data-spec-url] or <script id="api-reference" /> element. Try adding it like this: %c<div data-spec-url="https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml" />',
    'font-family: monospace;',
  )
} else {
  const specOrSpecUrl = getSpec()
    ? {
        content: getSpec(),
      }
    : {
        url: getSpecUrl(),
      }

  Object.assign(props, {
    configuration: {
      ...getConfiguration(),
      spec: { ...specOrSpecUrl },
      proxy: getProxyUrl(),
    },
  })

  document.body?.classList.add('light-mode')

  // If it’s a script tag, we can’t mount the Vue.js app inside that tag.
  // We need to add a new container div before the script tag.
  const createContainer = () => {
    let _container: Element | null = null
    if (specScriptTag) {
      _container = document.createElement('div')
      specScriptTag?.parentNode?.insertBefore(_container, specScriptTag)
    } else {
      _container = specElement || specUrlElement || document.body
    }
    return _container
  }

  const container = createContainer()

  // Wrap create app in factory for re-loading
  const createAppFactory = () => {
    const _app = createApp(() => h(ApiReference, props))

    if (container) {
      _app.mount(container)
    } else {
      console.error('Could not find a mount point for API References')
    }
    return _app
  }

  let app = createAppFactory()

  // Allow user to reload whole vue app
  document.addEventListener(
    'scalar:reload-references',
    () => {
      // Check if elemenet has been removed from dom, and re-add
      if (container && !document.body.contains(container)) {
        document.body.appendChild(container)
      }
      app.unmount()
      app = createAppFactory()
    },
    false,
  )

  // Allow user to update config
  document.addEventListener(
    'scalar:update-references-config',
    (ev) => {
      if ('detail' in ev) Object.assign(props, ev.detail)
    },
    false,
  )
}
