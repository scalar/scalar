import type { Heading, TransformedOperation } from '@scalar/oas-utils'
import { slug } from 'github-slugger'
import { onMounted, ref } from 'vue'

import { scrollToId, sleep } from '../helpers'
import type { Tag } from '../types'

// Keeps track of the URL hash without the #
const hash = ref('')

// To disable the intersection observer on click
const isIntersectionEnabled = ref(false)

/**
 * ID creation methods
 */
const getHeadingId = (heading: Heading) => {
  if (heading.slug) {
    return `description/${heading.slug}`
  }

  return ''
}

const getWebhookId = (name?: string, httpVerb?: string) => {
  if (!name) {
    return 'webhooks'
  }

  const webhookSlug = slug(name)
  const encodedSlug = encodeURIComponent(webhookSlug)
  return `webhook/${httpVerb}/${encodedSlug}`
}

const getModelId = (name?: string) => {
  if (!name) {
    return 'models'
  }

  const modelSlug = slug(name)
  const encodedSlug = encodeURIComponent(modelSlug)
  return `model/${encodedSlug}`
}

const getOperationId = (operation: TransformedOperation, parentTag: Tag) =>
  `${getTagId(parentTag)}/${operation.httpVerb}${operation.path}`

const getTagId = ({ name }: Tag) => {
  const tagSlug = slug(name)
  const encodedSlug = encodeURIComponent(tagSlug)

  return `tag/${encodedSlug}`
}

// Grabs the sectionId of the hash to open the section before scrolling
const getSectionId = (hashStr = hash.value) => {
  const tagId = hashStr.match(/(tag\/[^/]+)/)?.[0]
  const modelId = hashStr.startsWith('model') ? 'models' : ''

  return tagId ?? modelId
}

// Update the reactive hash state
const updateHash = () => (hash.value = window.location.hash.replace(/^#/, ''))

// We should call this as little as possible, ideally once
const enableHashListener = () =>
  onMounted(async () => {
    updateHash()
    window.onhashchange = async () => {
      isIntersectionEnabled.value = false
      updateHash()

      // TODO: we should be able to remove this once we find the cause
      // for some reason pressing back doesn't always scroll to the correct section
      scrollToId(window.location.hash.replace(/^#/, ''))

      await sleep(100)
      isIntersectionEnabled.value = true
    }
  })

/**
 * Hook which provides reactive hash state from the URL
 * Also hash is only readable by the client so keep that in mind for SSR
 *
 * isIntersectionEnabled is a hack to prevent intersection observer from triggering
 * when clicking on sidebar links or going backwards
 *
 *
 * @param hasLifecyle - we cannot use lifecycle hooks when called from another composable, this prevents that
 */
export const useNavState = () => {
  return {
    hash,
    getWebhookId,
    getModelId,
    getHeadingId,
    getOperationId,
    getSectionId,
    getTagId,
    isIntersectionEnabled,
    enableHashListener,
  }
}
