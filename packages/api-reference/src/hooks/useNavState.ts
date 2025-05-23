import { useConfig } from '@/hooks/useConfig'
import { combineUrlAndPath } from '@scalar/oas-utils/helpers'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { Heading, Tag, TransformedOperation } from '@scalar/types/legacy'
import { slug } from 'github-slugger'
import { type InjectionKey, type Ref, inject, ref } from 'vue'

export type NavState = {
  /** The URL hash without the #, also the "hash" pulled from pathRouting */
  hash: Ref<string>
  /** The prefix for the hash, used in ORG */
  hashPrefix: Ref<string>
  /** Whether the intersection observer is enabled and updating the hash as we scroll */
  isIntersectionEnabled: Ref<boolean>
}
export const NAV_STATE_SYMBOL = Symbol() as InjectionKey<NavState>

/** We inject a backup global refs in case one isn't provided for any integrations not using ApiReference */
const isIntersectionEnabledBackup = ref(false)
const hashBackup = ref('')
const hashPrefixBackup = ref('')

/**
 * Hook which provides reactive hash state from the URL
 * Also hash is only readable by the client so keep that in mind for SSR
 *
 * isIntersectionEnabled is a hack to prevent intersection observer from triggering
 * when clicking on sidebar links or going backwards
 *
 * @param _config this is used to pass in the config if we have not provided it yet to the useConfig hook such as in ApiReferenceLayout
 */
export const useNavState = (_config?: Ref<ApiReferenceConfiguration>) => {
  const { isIntersectionEnabled, hash, hashPrefix } = inject(NAV_STATE_SYMBOL, {
    isIntersectionEnabled: isIntersectionEnabledBackup,
    hash: hashBackup,
    hashPrefix: hashPrefixBackup,
  })

  const config = _config ?? useConfig()

  const getPathRoutingId = (pathName: string) => {
    if (!config.value.pathRouting) {
      return ''
    }

    const reggy = new RegExp('^' + config.value.pathRouting?.basePath + '/?')
    return decodeURIComponent(pathName.replace(reggy, ''))
  }

  // Grabs the sectionId of the hash to open the section before scrolling
  const getSectionId = (hashStr = hash.value) => {
    const tagId = hashStr.match(/(tag\/[^/]+)/)?.[0]
    const modelId = hashStr.startsWith('model') ? 'models' : ''
    const webhookId = hashStr.startsWith('webhook') ? 'webhooks' : ''

    return tagId || modelId || webhookId
  }

  /**
   * Gets the portion of the hash or path used by the references
   *
   * @returns The id without the prefix
   */
  const getReferenceId = () =>
    config.value.pathRouting
      ? getPathRoutingId(window.location.pathname)
      : // Must remove the prefix from the hash as the internal hash value should be pure
        decodeURIComponent(window.location.hash.replace(/^#/, '')).slice(hashPrefix.value.length)

  // Update the reactive hash state
  const updateHash = () => (hash.value = getReferenceId())

  const replaceUrlState = (replacementHash: string, url = window.location.href) => {
    const newUrl = new URL(url)

    // If we are pathrouting, set path instead of hash
    if (config.value.pathRouting) {
      newUrl.pathname = combineUrlAndPath(config.value.pathRouting.basePath, replacementHash)
    } else {
      newUrl.hash = hashPrefix.value + replacementHash
    }

    // Update the hash ref
    hash.value = replacementHash

    // We use replaceState so we don't trigger the url hash watcher and trigger a scroll
    // this is why we set the hash value directly
    window.history.replaceState({}, '', newUrl)
  }

  const getHashedUrl = (replacementHash: string, url = window.location.href, search = window.location.search) => {
    const newUrl = new URL(url)

    // Path routing
    if (config.value.pathRouting) {
      newUrl.pathname = combineUrlAndPath(config.value.pathRouting.basePath, replacementHash)
    }
    // Hash routing
    else {
      newUrl.hash = hashPrefix.value + replacementHash
    }
    newUrl.search = search
    return newUrl.toString()
  }

  const getFullHash = (hashTarget: string = hash.value) => {
    return `${hashPrefix.value}${hashTarget}`
  }

  /**
   * ID creation methods
   */
  const getHeadingId = (heading: Heading) => {
    if (typeof config.value.generateHeadingSlug === 'function') {
      return `${config.value.generateHeadingSlug(heading)}`
    }

    if (heading.slug) {
      return `description/${heading.slug}`
    }
    return ''
  }

  const getModelId = (model?: { name: string }) => {
    if (!model?.name) {
      return 'models'
    }

    if (typeof config.value.generateModelSlug === 'function') {
      return `model/${config.value.generateModelSlug(model)}`
    }
    return `model/${slug(model.name)}`
  }

  const getTagId = (tag: Tag) => {
    if (typeof config.value.generateTagSlug === 'function') {
      return `tag/${config.value.generateTagSlug(tag)}`
    }
    return `tag/${slug(tag.name)}`
  }

  const getOperationId = (operation: TransformedOperation, parentTag: Tag) => {
    if (typeof config.value.generateOperationSlug === 'function') {
      return `${getTagId(parentTag)}/${config.value.generateOperationSlug({
        path: operation.path,
        operationId: operation.operationId,
        method: operation.httpVerb,
        summary: operation.information?.summary,
      })}`
    }
    return `${getTagId(parentTag)}/${operation.httpVerb}${operation.path}`
  }

  const getWebhookId = (webhook?: { name: string; method?: string }) => {
    if (!webhook?.name) {
      return 'webhooks'
    }

    if (typeof config.value.generateWebhookSlug === 'function') {
      return `webhook/${config.value.generateWebhookSlug(webhook)}`
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
    getReferenceId,
    getWebhookId,
    getModelId,
    getHeadingId,
    getOperationId,
    getPathRoutingId,
    getSectionId,
    getTagId,
    isIntersectionEnabled,
    updateHash,
  }
}
