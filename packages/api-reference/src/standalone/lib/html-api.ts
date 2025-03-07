import type { ReferenceProps } from '@/types'
import { type ApiReferenceConfiguration, apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { createHead } from '@unhead/vue'
import { type App, createApp, h, reactive } from 'vue'

import { default as ApiReference } from '@/components/ApiReference.vue'

const getSpecScriptTag = (doc: Document) => doc.getElementById('api-reference')

/**
 * Reading the configuration from the data-attributes.
 */
export function getConfigurationFromDataAttributes(doc: Document): ApiReferenceConfiguration {
  const specElement = doc.querySelector('[data-spec]')
  const specUrlElement = doc.querySelector('[data-spec-url]')
  const configurationScriptElement = doc.querySelector('#api-reference[data-configuration]')

  const getConfiguration = () => {
    // <script data-configuration="{ … }" />
    if (configurationScriptElement) {
      const configurationFromElement = configurationScriptElement.getAttribute('data-configuration')

      if (configurationFromElement) {
        return {
          _integration: 'html',
          ...JSON.parse(configurationFromElement.split('&quot;').join('"')),
        }
      }
    }

    return apiReferenceConfigurationSchema.parse({ _integration: 'html' })
  }

  const getSpecUrl = () => {
    // Let’s first check if the user passed a spec URL in the configuration.
    if (getConfiguration().spec?.url) {
      return getConfiguration().spec?.url
    }

    // <script id="api-reference" data-url="/scalar.json" />
    const specScriptTag = getSpecScriptTag(doc)
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
    const specScriptTag = getSpecScriptTag(doc)
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
    const specScriptTag = getSpecScriptTag(doc)
    if (specScriptTag) {
      const proxyUrl = specScriptTag.getAttribute('data-proxy-url')

      if (proxyUrl) {
        return proxyUrl.trim()
      }
    }

    return undefined
  }

  // Ensure Reference Props are reactive
  if (!specUrlElement && !specElement && !getSpecScriptTag(doc)) {
    // Stay quiet.
  } else {
    const specOrSpecUrl = getSpec() ? { content: getSpec() } : { url: getSpecUrl() }

    return apiReferenceConfigurationSchema.parse({
      _integration: 'html',
      proxyUrl: getProxyUrl(),
      ...getConfiguration(),
      spec: { ...specOrSpecUrl },
    })
  }

  return apiReferenceConfigurationSchema.parse({ _integration: 'html' })
}

/**
 * Mount the Scalar API Reference on a given document.
 * Read the HTML data-attributes for configuration.
 */
export function findDataAttributes(doc: Document, configuration: ApiReferenceConfiguration) {
  /** @deprecated Use the new <script id="api-reference" data-url="/scalar.json" /> API instead. */
  const specElement = doc.querySelector('[data-spec]')
  /** @deprecated Use the new <script id="api-reference" data-url="/scalar.json" /> API instead. */
  const specUrlElement = doc.querySelector('[data-spec-url]')

  if (configuration?.darkMode) {
    doc.body?.classList.add('dark-mode')
  } else {
    doc.body?.classList.add('light-mode')
  }

  const container = createContainer(doc, specElement || specUrlElement)

  if (container) {
    createApiReference(container, configuration, doc)
  }
}

// If it's a script tag, we can't mount the Vue.js app inside that tag.
// We need to add a new container element before the script tag.
export const createContainer = (doc: Document, element?: Element | null) => {
  let _container: Element | null = null

  const specScriptTag = getSpecScriptTag(doc)

  if (specScriptTag) {
    _container = doc.createElement('div')
    specScriptTag?.parentNode?.insertBefore(_container, specScriptTag)
  } else if (element) {
    _container = element
  }

  return _container
}

/**
 * Create and mount a new Scalar API Reference
 */
export const createApiReference = (
  elementOrSelector: Element | string,
  givenConfiguration: ApiReferenceConfiguration,
  givenDocument?: Document,
) => {
  const doc = givenDocument || document

  const props = reactive<ReferenceProps>({
    configuration: givenConfiguration,
  })

  const createAndMountApp = () => {
    // If the element is a string, we need to find the actual DOM element
    let element = typeof elementOrSelector === 'string' ? doc.querySelector(elementOrSelector) : elementOrSelector

    // Create a new Vue app instance
    let instance = createApp(() => h(ApiReference, props))

    // Meta tags, etc.
    instance.use(createHead())

    // Mounting the app
    if (element) {
      instance.mount(element)
    } else {
      console.error('Could not find a mount point for API References:', elementOrSelector)
    }

    // Bind events
    doc.addEventListener(
      'scalar:reload-references',
      () => {
        // Check if element has been removed from dom, and re-add
        if (!doc.body.contains(element)) {
          element = createContainer(doc)
        }

        instance.unmount()

        if (!element) {
          return
        }

        // @ts-expect-error known issue
        instance = createApiReference(element, props.configuration, doc) as App<Element>
      },
      false,
    )

    // Allow user to destroy the vue app
    doc.addEventListener(
      'scalar:destroy-references',
      () => {
        delete props['configuration']
        instance.unmount()
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

    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
      // If not loaded, wait for DOMContentLoaded
      return new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', () => {
          resolve(createAndMountApp())
        })
      })
    }

    return instance
  }

  // If already loaded, execute immediately
  return createAndMountApp()
}
