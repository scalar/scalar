import {
  type Heading,
  type TransformedOperation,
  ssrState,
} from '@scalar/oas-utils'
import { slug } from 'github-slugger'
import { ref } from 'vue'

import type { PathRouting, Tag } from '../types'

// Keeps track of the URL hash without the #
const hash = ref(ssrState.hash ?? '')

// Are we using path routing
const pathRouting = ref<PathRouting | undefined>()

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

const getPathRoutingId = (pathName: string) => {
  if (!pathRouting.value) return ''

  const reggy = new RegExp('^' + pathRouting.value?.basePath + '/?')
  return decodeURIComponent(pathName.replace(reggy, ''))
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
const updateHash = () => {
  hash.value = pathRouting.value
    ? getPathRoutingId(window.location.pathname)
    : decodeURIComponent(window.location.hash.replace(/^#/, ''))
}

/**
 * Hook which provides reactive hash state from the URL
 * Also hash is only readable by the client so keep that in mind for SSR
 *
 * isIntersectionEnabled is a hack to prevent intersection observer from triggering
 * when clicking on sidebar links or going backwards
 */
export const useNavState = () => ({
  hash,
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
})
