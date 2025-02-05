import { useConfig } from '@/hooks/useConfig'
import { combineUrlAndPath, ssrState } from '@scalar/oas-utils/helpers'
import type { Heading, Tag, TransformedOperation } from '@scalar/types/legacy'
import { slug } from 'github-slugger'
import { ref } from 'vue'

import type { PathRouting } from '../types'

const hashPrefix = ref('')

// Keeps track of the URL hash without the #
const hash = ref(ssrState.hash ?? '')

// Are we using path routing
const pathRouting = ref<PathRouting | undefined>()

// To disable the intersection observer on click
const isIntersectionEnabled = ref(false)

const getPathRoutingId = (pathName: string) => {
  if (!pathRouting.value) return ''

  const reggy = new RegExp('^' + pathRouting.value?.basePath + '/?')
  return decodeURIComponent(pathName.replace(reggy, ''))
}

// Grabs the sectionId of the hash to open the section before scrolling
const getSectionId = (hashStr = hash.value) => {
  const tagId = hashStr.match(/(tag\/[^/]+)/)?.[0]
  const modelId = hashStr.startsWith('model') ? 'models' : ''
  const webhookId = hashStr.startsWith('webhook') ? 'webhooks' : ''

  return tagId || modelId || webhookId
}

// Update the reactive hash state
const updateHash = () => {
  hash.value = pathRouting.value
    ? getPathRoutingId(window.location.pathname)
    : // Must remove the prefix from the hash as the internal hash value should be pure
      decodeURIComponent(window.location.hash.replace(/^#/, '')).slice(
        hashPrefix.value.length,
      )
}

const replaceUrlState = (
  replacementHash: string,
  url = window.location.href,
) => {
  const newUrl = new URL(url)

  // If we are pathrouting, set path instead of hash
  if (pathRouting.value) {
    newUrl.pathname = combineUrlAndPath(
      pathRouting.value.basePath,
      replacementHash,
    )
  } else {
    newUrl.hash = hashPrefix.value + replacementHash
  }

  // Update the hash ref
  hash.value = replacementHash

  // We use replaceState so we don't trigger the url hash watcher and trigger a scroll
  // this is why we set the hash value directly
  window.history.replaceState({}, '', newUrl)
}

const getHashedUrl = (
  replacementHash: string,
  url = window.location.href,
  search = window.location.search,
) => {
  const newUrl = new URL(url)
  newUrl.hash = hashPrefix.value + replacementHash
  newUrl.search = search
  return newUrl.toString()
}

const getFullHash = (hashTarget: string = hash.value) => {
  return `${hashPrefix.value}${hashTarget}`
}

/**
 * Gets the portion of the hash used by the references
 *
 * @returns The hash without the prefix
 */
const getReferenceHash = () =>
  decodeURIComponent(
    window.location.hash.replace(/^#/, '').slice(hashPrefix.value.length),
  )

/**
 * Hook which provides reactive hash state from the URL
 * Also hash is only readable by the client so keep that in mind for SSR
 *
 * isIntersectionEnabled is a hack to prevent intersection observer from triggering
 * when clicking on sidebar links or going backwards
 */
export const useNavState = () => {
  const config = useConfig()

  /**
   * ID creation methods
   */
  const getHeadingId = (heading: Heading) => {
    if (typeof config?.generateHeadingSlug === 'function') {
      return `${config.generateHeadingSlug(heading)}`
    }

    if (heading.slug) return `description/${heading.slug}`
    return ''
  }

  const getModelId = (model?: { name: string }) => {
    if (!model?.name) return 'models'

    if (typeof config?.generateModelSlug === 'function') {
      return `model/${config.generateModelSlug(model)}`
    }
    return `model/${slug(model.name)}`
  }

  const getTagId = (tag: Tag) => {
    if (typeof config?.generateTagSlug === 'function') {
      return `tag/${config.generateTagSlug(tag)}`
    }
    return `tag/${slug(tag.name)}`
  }

  const getOperationId = (operation: TransformedOperation, parentTag: Tag) => {
    if (typeof config?.generateOperationSlug === 'function') {
      return `${getTagId(parentTag)}/${config.generateOperationSlug({
        path: operation.path,
        operationId: operation.operationId,
        method: operation.httpVerb,
        summary: operation.information?.summary,
      })}`
    }
    return `${getTagId(parentTag)}/${operation.httpVerb}${operation.path}`
  }

  const getWebhookId = (webhook?: { name: string; method?: string }) => {
    if (!webhook?.name) return 'webhooks'

    if (typeof config?.generateWebhookSlug === 'function') {
      return `webhook/${config.generateWebhookSlug(webhook)}`
    }
    return `webhook/${webhook.method}/${slug(webhook.name)}`
  }

  return {
    hash,
    /** Sets the prefix for the hash */
    setHashPrefix: (prefix: string) => {
      hashPrefix.value = prefix
    },
    /**
     * Gets the full hash with the prefix
     * @param hashTarget The hash to target with the return
     * @returns The full hash
     */
    getFullHash,
    /**
     * Gets the hashed url with the prefix
     * @param replacementHash The hash to replace the current hash with
     * @param url The url to get the hashed url from
     * @returns The hashed url
     */
    getHashedUrl,
    /**
     * Replaces the URL state with the new url and hash
     * Replacement is used so that hash changes don't trigger the url hash watcher and cause a scroll
     */
    replaceUrlState,
    /** Gets the portion of the hash used by the references */
    getReferenceHash,
    getWebhookId,
    getModelId,
    getHeadingId,
    getOperationId,
    getPathRoutingId,
    getSectionId,
    getTagId,
    isIntersectionEnabled,
    pathRouting,
    updateHash,
  }
}
