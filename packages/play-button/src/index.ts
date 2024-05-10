/**
 * This file is the entry point for the CDN version of the Scalar Test Button.
 * It’s responsible for finding the spec and configuration in the HTML, and mounting the Vue.js app.
 */
import { ApiClientModal, openClientFor, parse } from '@scalar/api-reference'
import { createApp, h, reactive } from 'vue'

const specScriptTag = document.getElementById('scalar-play-button-script')
const testButtons = document.getElementsByClassName('scalar-play-button')
const specElement = document.querySelector('[data-spec]')
const specUrlElement = document.querySelector('[data-spec-url]')

const getSpecUrl = () => {
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
      '[@scalar/play-button] The [data-spec-url] HTML API is deprecated. Use the new <script id="api-reference" data-url="/scalar.json" /> API instead.',
    )
    const urlFromSpecUrlElement = specUrlElement.getAttribute('data-spec-url')

    if (urlFromSpecUrlElement) {
      return urlFromSpecUrlElement
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
  const createAppFactory = async () => {
    const specUrl = getSpecUrl()

    if (!specUrl) return

    const resp = await fetch(specUrl)
    const spec = await resp.json()

    const parsedSpec = reactive(await parse(spec))

    // const _app = createApp(
    //   h(ScalarButtonStyles, null, {
    //     default: () =>
    //       h(ApiClientModal, {
    //         parsedSpec,
    //         theme: 'default',
    //       }),
    //   }),
    // )

    const _app = createApp(
      h(ApiClientModal, {
        parsedSpec,
        theme: 'default',
      }),
    )

    if (container) {
      _app.mount(container)

      for (const testButton of testButtons) {
        const operationId = testButton.getAttribute('scalar-operation-id')
        const specifiedOperation = parsedSpec.tags?.[0]?.operations?.find(
          (op) => op.operationId === operationId,
        )

        testButton?.addEventListener('click', () => {
          if (specifiedOperation) {
            openClientFor(specifiedOperation)
          } else {
            const firstOperation = parsedSpec.tags?.[0]?.operations?.[0]
            if (firstOperation) {
              openClientFor(firstOperation)
            }
          }
        })
      }
    } else {
      console.error('Could not find a mount point for API References')
    }
    return _app
  }

  createAppFactory()
}
