/**
 * This file is the entry point for the CDN version of the API Reference.
 * It’s responsible for finding the spec and configuration in the HTML, and mounting the Vue.js app.
 */
import type { ReferenceProps } from '@/types'
import type { ReferenceConfiguration } from '@scalar/types/legacy'
import { createHead } from '@unhead/vue'
import { createApp, h, reactive } from 'vue'

import { default as ApiReference } from './components/ApiReference.vue'

const getSpecScriptTag = () => document.getElementById('api-reference')
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
      return {
        _integration: 'html',
        ...JSON.parse(configurationFromElement.split('&quot;').join('"')),
      }
    }
  }

  return { _integration: 'html' }
}

const getSpecUrl = () => {
  // Let’s first check if the user passed a spec URL in the configuration.
  if (getConfiguration().spec?.url) {
    return getConfiguration().spec?.url
  }

  // <script id="api-reference" data-url="/scalar.json" />
  const specScriptTag = getSpecScriptTag()
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

const getSpec = (): string | undefined => {
  // <script id="api-reference" type="application/json">{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}</script>
  const specScriptTag = getSpecScriptTag()
  if (specScriptTag) {
    const specFromScriptTag = specScriptTag.innerHTML?.trim()

    if (specFromScriptTag) {
      return specFromScriptTag
    }
  }

  // <div data-spec='{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}' />
  if (specElement) {
    console.warn(
      '[@scalar/api-reference] The [data-spec] HTML API is deprecated. Use the new <script id="api-reference" type="application/json">{"openapi":"3.1.0","info":{"title":"Example"},"paths":{}}</script> API instead.',
    )
    const specFromSpecElement = specElement.getAttribute('data-spec')?.trim()

    if (specFromSpecElement) {
      return specFromSpecElement
    }
  }

  return undefined
}

const getProxyUrl = () => {
  // <script id="api-reference" data-proxy-url="https://proxy.scalar.com">…</script>
  const specScriptTag = getSpecScriptTag()
  if (specScriptTag) {
    const proxyUrl = specScriptTag.getAttribute('data-proxy-url')

    if (proxyUrl) {
      return proxyUrl.trim()
    }
  }

  return undefined
}

// Ensure Reference Props are reactive
const props = reactive<ReferenceProps>({})

if (!specUrlElement && !specElement && !getSpecScriptTag()) {
  console.error(
    'Couldn’t find a [data-spec], [data-spec-url] or <script id="api-reference" /> element. Try adding it like this: %c<div data-spec-url="https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml" />',
    'font-family: monospace;',
  )
} else {
  const specOrSpecUrl = getSpec()
    ? { content: getSpec() }
    : { url: getSpecUrl() }

  Object.assign(props, {
    configuration: {
      _integration: 'html',
      proxyUrl: getProxyUrl(),
      ...getConfiguration(),
      spec: { ...specOrSpecUrl },
    } satisfies ReferenceConfiguration,
  })

  if (getConfiguration().darkMode) {
    document.body?.classList.add('dark-mode')
  } else {
    document.body?.classList.add('light-mode')
  }

  // If it’s a script tag, we can’t mount the Vue.js app inside that tag.
  // We need to add a new container element before the script tag.
  const createContainer = () => {
    let _container: Element | null = null
    const specScriptTag = getSpecScriptTag()
    if (specScriptTag) {
      _container = document.createElement('main')
      specScriptTag?.parentNode?.insertBefore(_container, specScriptTag)
    } else {
      _container = specElement || specUrlElement || document.body
    }
    return _container
  }

  let container = createContainer()

  // Wrap create app in factory for re-loading
  const createAppFactory = () => {
    const _app = createApp(() => h(ApiReference, props))

    const head = createHead()
    _app.use(head)

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
      // Check if element has been removed from dom, and re-add
      if (!document.body.contains(container)) {
        console.log('Re-adding container')
        container = createContainer()
      }

      app.unmount()
      app = createAppFactory()
    },
    false,
  )

  // Allow user to destroy the vue app
  document.addEventListener(
    'scalar:destroy-references',
    () => {
      delete props['configuration']
      app.unmount()
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
