import type { ReferenceProps } from '@/types'
import {
  type AnyApiReferenceConfiguration,
  type ApiReferenceConfiguration,
  apiReferenceConfigurationSchema,
  type CreateApiReference,
} from '@scalar/types/api-reference'
import { createHead } from '@unhead/vue'
import { createApp, h, reactive } from 'vue'

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

  const getUrl = () => {
    // Let’s first check if the user passed a spec URL in the configuration.
    if (getConfiguration().url) {
      return getConfiguration().url
    }

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

  const getContent = (): string | undefined => {
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
    const urlOrContent = getContent() ? { content: getContent() } : { url: getUrl() }

    return apiReferenceConfigurationSchema.parse({
      _integration: 'html',
      proxyUrl: getProxyUrl(),
      ...getConfiguration(),
      ...urlOrContent,
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
    createApiReference(container, configuration)
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
 * Create (and mount) a new Scalar API Reference
 *
 * @example createApiReference({ url: '/scalar.json' }).mount('#app')
 * @example createApiReference('#app', { url: '/scalar.json' })
 * @example createApiReference(document.getElementById('app'), { url: '/scalar.json' })
 */
export const createApiReference: CreateApiReference = (
  elementOrSelectorOrConfig,
  optionalConfiguration?: AnyApiReferenceConfiguration,
) => {
  const props = reactive<ReferenceProps>({
    // Either the configuration will be the second arugment or it MUST be the first (configuration only)
    configuration: optionalConfiguration ?? (elementOrSelectorOrConfig as AnyApiReferenceConfiguration) ?? {},
  })

  // Create a new Vue app instance
  let app = createApp(() => h(ApiReference, props))

  // Meta tags, etc.
  app.use(createHead())

  // If we have an optional config, then we must mount the element immediately (not sure why type is not narrowing)
  if (optionalConfiguration) {
    // If the element is a string, we need to find the actual DOM element
    const element =
      typeof elementOrSelectorOrConfig === 'string'
        ? document.querySelector(elementOrSelectorOrConfig)
        : (elementOrSelectorOrConfig as Element)

    if (element) {
      app.mount(element)
    } else {
      console.error('Could not find a mount point for API References:', elementOrSelectorOrConfig)
    }
  }

  /**
   * Reload the API Reference
   * @deprecated
   */
  document.addEventListener(
    'scalar:reload-references',
    () => {
      console.warn(
        'scalar:reload-references event has been deprecated, please use the scalarInstance.app.mount method instead.',
      )
      if (!props.configuration) {
        return
      }

      // Snag the current element
      const currentElement =
        typeof elementOrSelectorOrConfig === 'string'
          ? document.querySelector(elementOrSelectorOrConfig)
          : (elementOrSelectorOrConfig as Element)

      if (!currentElement) {
        return
      }

      // Ensure we re-attach the element if it was unmounted
      if (currentElement && !document.body.contains(currentElement)) {
        document.body.appendChild(currentElement)
      }

      // Create a new Vue app instance
      app.unmount()
      app = createApp(() => h(ApiReference, props))
      app.use(createHead())
      app.mount(currentElement)
    },
    false,
  )

  /** Destroy the current API Reference instance */
  const destroy = () => {
    delete props['configuration']
    app.unmount()
  }

  /**
   * Allow user to destroy the API Reference
   * @deprecated
   */
  document.addEventListener(
    'scalar:destroy-references',
    () => {
      console.warn('scalar:destroy-references event has been deprecated, please use scalarInstance.destroy instead.')
      destroy()
    },
    false,
  )

  /**
   * Allow user to update configuration
   * @deprecated
   */
  document.addEventListener(
    'scalar:update-references-config',
    (ev) => {
      console.warn(
        'scalar:update-references-config event has been deprecated, please use scalarInstance.updateConfiguration instead.',
      )
      if ('detail' in ev) {
        Object.assign(props, ev.detail)
      }
    },
    false,
  )

  const instance = {
    app,
    getConfiguration: () => props.configuration ?? {},
    updateConfiguration: (newConfig: AnyApiReferenceConfiguration) => {
      props.configuration = newConfig
    },
    destroy,
  }

  return instance
}
