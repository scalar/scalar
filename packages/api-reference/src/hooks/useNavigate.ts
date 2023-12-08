import { slug } from 'github-slugger'
import { onMounted, reactive, ref } from 'vue'

import { type Heading } from '../helpers'
import type { Tag, TransformedOperation } from '../types'

type NavState = {
  id?: string
  label?: string
}

// Enables the interesection observer
const canIntersect = ref(true)
const navState = reactive<NavState>({})

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

/**
 * Hook which provides reactive navigation state which equates to the url hash
 * Also hash is only readable by the client so keep that in mind for SSR
 */
export const useNavigate = () => {
  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
  if (typeof window !== 'undefined' && window?.location?.hash) {
    navState.id = window.location.hash.replace(/^#/, '')
  }

  onMounted(() => {
    window.onhashchange = () =>
      (navState.id = window.location.hash.replace(/^#/, ''))
  })

  return {
    canIntersect,
    getModelId,
    getHeadingId,
    getOperationId,
    getTagId,
    navState,
  }
}
