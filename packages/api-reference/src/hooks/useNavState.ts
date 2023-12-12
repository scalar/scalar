import { slug } from 'github-slugger'
import { onMounted, ref } from 'vue'

import { type Heading, scrollToId } from '../helpers'
import type { Tag, TransformedOperation } from '../types'

// Keeps track of the URL hash without the #
const hash = ref('')

/**
 * ID creation methods
 */
const getHeadingId = (heading: Heading) => {
  if (heading.slug) {
    return `description/${heading.slug}`
  }

  return ''
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
  `${getTagId(parentTag)}/${operation.operationId}/${operation.httpVerb}${
    operation.path
  }`

const getTagId = ({ name }: Tag) => {
  const tagSlug = slug(name)
  const encodedSlug = encodeURIComponent(tagSlug)

  return `tag/${encodedSlug}`
}

// Grabs the sectionId of the hash to open the section before scrolling
const getSectionId = (hashStr = hash.value) => {
  const tagId = hashStr.match(/(tag\/[^/]+)/)?.[0]
  const modelId = hashStr.includes('model/') ? 'models' : ''

  return tagId ?? modelId
}

// Update the reactive hash state
const updateHash = () => (hash.value = window.location.hash.replace(/^#/, ''))

/**
 * Hook which provides reactive hash state from the URL
 * Also hash is only readable by the client so keep that in mind for SSR
 *
 * @param hasLifecyle - we cannot use lifecycle hooks when called from another composable, this prevents that
 */
export const useNavState = (hasLifecyle = true) => {
  if (hasLifecyle) {
    onMounted(() => {
      updateHash()
      window.onhashchange = () => {
        updateHash()

        // TODO: we should be able to remove this once we find the cause
        // for some reason pressing back doesn't always scroll to the correct section
        scrollToId(window.location.hash.replace(/^#/, ''))
      }
    })
  }

  return {
    hash,
    getModelId,
    getHeadingId,
    getOperationId,
    getSectionId,
    getTagId,
  }
}
