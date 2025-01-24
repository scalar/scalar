/**
 * This file is the entry point for the CDN version of the Scalar Test Button.
 * It’s responsible for finding the spec and configuration in the HTML, and mounting the Vue.js app.
 */
import { createApiClientModal } from '@scalar/api-client'
import { parse } from '@scalar/api-reference'
import type { Spec, Tag, TransformedOperation } from '@scalar/types/legacy'
import { reactive } from 'vue'

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

  // <script id="scalar-play-button-script" type="application/json">{ "openapi": "3.1.0", … }</script>
  // <script id="scalar-play-button-script" type="application/yaml">…</script>
  const specFromScriptTag = specScriptTag?.innerHTML?.trim()

  if (specFromScriptTag) {
    return specFromScriptTag
  }

  return undefined
}

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

    const parsedSpec: Spec = reactive(await parse(specUrl))

    if (!container) {
      console.error('Could not find a mount point for API References')
      return null
    }

    const { open } = await createApiClientModal({
      el: container as HTMLElement,
      configuration: {
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        },
        proxyUrl: 'https://proxy.scalar.com',
      },
    })

    for (const testButton of testButtons) {
      testButton?.addEventListener('click', () => {
        // Operation ID from data attribute
        const operationId = testButton.getAttribute('scalar-operation-id')

        // Loop through all tags and operations to find the specified operation
        const specifiedOperation = parsedSpec.tags?.reduce(
          (acc: TransformedOperation | undefined, tag: Tag) => {
            if (acc) {
              return acc
            }

            return tag.operations?.find(
              (operation) => operation.operationId === operationId,
            )
          },
          undefined,
        ) as unknown as TransformedOperation

        if (specifiedOperation) {
          open({
            path: specifiedOperation.path,
            method: specifiedOperation.httpVerb.toLowerCase() as Exclude<
              Lowercase<typeof specifiedOperation.httpVerb>,
              'connect' | 'trace'
            >,
          })
        } else {
          const firstOperation = parsedSpec.tags?.[0]?.operations?.[0]

          if (firstOperation) {
            open({
              path: firstOperation.path,
              method: firstOperation.httpVerb.toLowerCase() as Exclude<
                Lowercase<typeof firstOperation.httpVerb>,
                'connect' | 'trace'
              >,
            })
          }
        }
      })
    }

    return null
  }

  createAppFactory()
}
