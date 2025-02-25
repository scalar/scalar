import type { ReferenceProps } from '@/types'
import type { ReferenceConfiguration } from '@scalar/types/legacy'
import { createHead } from '@unhead/vue'
import { createApp, h, reactive } from 'vue'

import { default as ApiReference } from '@/components/ApiReference.vue'

const getSpecScriptTag = (doc: Document) =>
  doc.querySelector('[data-scalar-api-reference]') || doc.getElementById('api-reference')

/**
 * Reading the configuration from the data-attributes.
 */
export function getConfigurationFromDataAttributes(doc: Document): ReferenceConfiguration | ReferenceConfiguration[] {
  const specElements = doc.querySelectorAll('[data-spec]')
  const specUrlElements = doc.querySelectorAll('[data-spec-url]')
  const configurationScriptElements = doc.querySelectorAll('[data-scalar-api-reference], #api-reference')

  // If we have multiple elements, process them all
  const totalElements = specElements.length + specUrlElements.length + configurationScriptElements.length
  if (totalElements > 1) {
    const configurations: ReferenceConfiguration[] = []

    // Process modern script tags
    configurationScriptElements.forEach((element) => {
      const config = processElement(element)
      if (config) configurations.push(config)
    })

    // Process deprecated elements in the correct order
    specUrlElements.forEach((element) => {
      showDeprecationWarning('data-spec-url')
      const config = processElement(element)
      if (config) configurations.push(config)
    })

    specElements.forEach((element) => {
      showDeprecationWarning('data-spec')
      const config = processElement(element)
      if (config) configurations.push(config)
    })

    return configurations
  }

  // For single or no elements, maintain existing behavior
  const element = getSpecScriptTag(doc) || specElements[0] || specUrlElements[0]

  // Show appropriate warning for deprecated elements
  if (element?.hasAttribute('data-spec')) {
    showDeprecationWarning('data-spec')
  } else if (element?.hasAttribute('data-spec-url')) {
    showDeprecationWarning('data-spec-url')
  }

  const config = processElement(element) || {}

  // Add error logging when no spec elements are found
  if (!element) {
    console.error(
      'Could not find a <script data-scalar-api-reference /> element. Try adding it like this: %c<div data-spec-url="https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml" />',
      'font-family: monospace;',
    )
  }

  return config
}

// Helper function to show consistent deprecation warnings
function showDeprecationWarning(attribute: 'data-spec' | 'data-spec-url') {
  console.warn(
    `[@scalar/api-reference] The [${attribute}] HTML API is deprecated. Use the new <script data-scalar-api-reference data-url="/scalar.json" /> API instead.`,
  )
}

// Helper function to process a single element
function processElement(element: Element | null): ReferenceConfiguration | null {
  if (!element) return null

  const getConfiguration = (): ReferenceConfiguration => {
    const configAttr = element.getAttribute('data-configuration')
    if (configAttr) {
      return {
        _integration: 'html',
        ...JSON.parse(configAttr.split('&quot;').join('"')),
      }
    }
    return { _integration: 'html' }
  }

  const getSpecUrl = () => {
    // Check configuration first
    if (getConfiguration().spec?.url) {
      return getConfiguration().spec?.url
    }

    // Then check data-url attribute
    const urlAttr = element.getAttribute('data-url')?.trim()
    if (urlAttr) return urlAttr

    // Finally check deprecated data-spec-url without showing warning here
    // Warning will be shown when processing the element in getConfigurationFromDataAttributes
    const specUrlAttr = element.getAttribute('data-spec-url')?.trim()
    if (specUrlAttr) return specUrlAttr

    return undefined
  }

  const getSpec = (): string | undefined => {
    if (element.tagName === 'SCRIPT') {
      const content = element.innerHTML?.trim()
      if (content) return content
    }

    const specAttr = element.getAttribute('data-spec')?.trim()
    if (specAttr) {
      return specAttr
    }

    return undefined
  }

  const getProxyUrl = () => {
    return element.getAttribute('data-proxy-url')?.trim()
  }

  const specOrSpecUrl = getSpec() ? { content: getSpec() } : { url: getSpecUrl() }

  return {
    _integration: 'html',
    proxyUrl: getProxyUrl(),
    ...getConfiguration(),
    spec: { ...specOrSpecUrl },
  }
}

/**
 * Mount the Scalar API Reference on a given document.
 * Read the HTML data-attributes for configuration.
 */
export function mountScalarApiReference(
  doc: Document,
  configuration: ReferenceConfiguration | ReferenceConfiguration[],
) {
  /** @deprecated Use the new <script data-scalar-api-reference data-url="/scalar.json" /> API instead. */
  const specElement = doc.querySelector('[data-spec]')
  /** @deprecated Use the new <script data-scalar-api-reference data-url="/scalar.json" /> API instead. */
  const specUrlElement = doc.querySelector('[data-spec-url]')

  const props = reactive<ReferenceProps>({
    // TODO: Just always use the first configuration for now. Once we support multiple configurations, we change this.
    configuration: Array.isArray(configuration) ? configuration[0] : configuration,
  })

  if (props.configuration?.darkMode) {
    doc.body?.classList.add('dark-mode')
  } else {
    doc.body?.classList.add('light-mode')
  }

  // If it's a script tag, we can't mount the Vue.js app inside that tag.
  // We need to add a new container element before the script tag.
  const createContainer = () => {
    let _container: Element | null = null

    const specScriptTag = getSpecScriptTag(doc)

    if (specScriptTag) {
      _container = doc.createElement('div')
      specScriptTag?.parentNode?.insertBefore(_container, specScriptTag)
    } else {
      _container = specElement || specUrlElement || doc.body
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
  doc.addEventListener(
    'scalar:reload-references',
    () => {
      // Check if element has been removed from dom, and re-add
      if (!doc.body.contains(container)) {
        console.log('Re-adding container')
        container = createContainer()
      }

      app.unmount()
      app = createAppFactory()
    },
    false,
  )

  // Allow user to destroy the vue app
  doc.addEventListener(
    'scalar:destroy-references',
    () => {
      delete props['configuration']
      app.unmount()
    },
    false,
  )

  // Allow user to update configuration
  doc.addEventListener(
    'scalar:update-references-config',
    (ev) => {
      if ('detail' in ev) Object.assign(props, ev.detail)
    },
    false,
  )
}
