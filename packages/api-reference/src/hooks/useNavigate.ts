import { slug } from 'github-slugger'
import { type Heading } from 'src/helpers'
import { ref } from 'vue'

import type { Tag, TransformedOperation } from '../types'

type NavState = {
  id?: string
  label?: string
}

const navState = ref<NavState>({})

export const navigate = (state: NavState) => {
  console.log({ state })
  navState.value = state
  if (state.id)
    window.history.replaceState(
      {},
      '',
      `${window.location.origin}${window.location.pathname}#${state.id}`,
    )
}

/**
 * Hook which provides reactive navigation state which equates to the url hash
 * Also hash is only readable by the client so keep that in mind for SSR
 */
export const useNavigate = () => {
  if (window?.location?.hash) {
    // TODO set initial state from hash
    console.log(window.location.hash)
  }

  return { navState }
}

/**
 * Co-located these methods in case we make changes
 */
export const getHeadingHash = (heading: Heading) => {
  if (heading.slug) {
    return new URLSearchParams({ description: heading.slug }).toString()
  }

  return ''
}

export const getModelHash = (name?: string) => {
  if (!name) {
    return 'models'
  }

  const model = slug(name)
  return new URLSearchParams({ model }).toString()
}

export const getOperationHash = (
  operation: TransformedOperation,
  parentTag: Tag,
) => {
  const parentSlug = slug(parentTag.name)

  return new URLSearchParams({
    tag: parentSlug,
    method: operation.httpVerb,
    path: operation.path,
  }).toString()
}

export const getTagHash = ({ name }: Tag) => {
  const tag = slug(name)
  return new URLSearchParams({ tag }).toString()
}
