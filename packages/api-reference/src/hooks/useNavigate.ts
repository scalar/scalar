import { slug } from 'github-slugger'
import { ref } from 'vue'

import { type Heading, sleep } from '../helpers'
import type { Tag, TransformedOperation } from '../types'

type NavState = {
  id?: string
  label?: string
  canIntersect?: boolean
}

const navState = ref<NavState>({ canIntersect: true })

/**
 * Main navigation method for the side bar
 *
 * @param shouldNavigate - determines whether or not to actually follow through with the navigation,
 *                         else just update the URL only
 */
export const navigate = async (state: NavState, shouldNavigate = true) => {
  navState.value = state
  if (!state.id) return

  // To avoid the intersection observer triggering a double navigate, we sleep for 100ms
  if (shouldNavigate) {
    navState.value.canIntersect = false
    window.location.replace(`#${state.id}`)
    await sleep(100)
    navState.value.canIntersect = true
  } else {
    window.history.replaceState({}, '', `#${state.id}`)
  }
}

/**
 * Hook which provides reactive navigation state which equates to the url hash
 * Also hash is only readable by the client so keep that in mind for SSR
 */
export const useNavigate = () => {
  if (window?.location?.hash) {
    navState.value = { id: window.location.hash.replace(/^#/, '') }
  }

  return { navState }
}

/**
 * Co-located these methods in case we make changes
 */
export const getHeadingId = (heading: Heading) => {
  if (heading.slug) {
    return new URLSearchParams({ description: heading.slug }).toString()
  }

  return ''
}

export const getModelId = (name?: string) => {
  if (!name) {
    return 'models'
  }

  const model = slug(name)
  return new URLSearchParams({ model }).toString()
}

export const getOperationId = (
  operation: TransformedOperation,
  parentTag: Tag,
) => {
  const parentSlug = slug(parentTag.name)

  return decodeURIComponent(
    new URLSearchParams({
      tag: parentSlug,
      method: operation.httpVerb,
      path: operation.path,
    }).toString(),
  )
}

export const getTagId = ({ name }: Tag) => {
  const tag = slug(name)
  return new URLSearchParams({ tag }).toString()
}
