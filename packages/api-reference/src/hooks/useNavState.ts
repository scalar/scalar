import { slug } from 'github-slugger'
import { onMounted, ref } from 'vue'

import { type Heading } from '../helpers'
import type { Tag, TransformedOperation } from '../types'

// Keeps track of the URL hash without the #
const hash = ref('')

/**
 * ID creation methods
 */
const getHeadingId = (heading: Heading) => {
  if (heading.slug) {
    return new URLSearchParams({ description: heading.slug }).toString()
  }

  return ''
}

const getModelId = (name?: string) => {
  if (!name) {
    return 'models'
  }

  const model = slug(name)
  return new URLSearchParams({ model }).toString()
}

const getOperationId = (operation: TransformedOperation, parentTag: Tag) => {
  const parentSlug = slug(parentTag.name)

  return decodeURIComponent(
    new URLSearchParams({
      tag: parentSlug,
      method: operation.httpVerb,
      path: operation.path,
    }).toString(),
  )
}

const getTagId = ({ name }: Tag) => {
  const tag = slug(name)
  return new URLSearchParams({ tag }).toString()
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
      window.onhashchange = updateHash
    })
  }

  return {
    hash,
    getModelId,
    getHeadingId,
    getOperationId,
    getTagId,
  }
}
