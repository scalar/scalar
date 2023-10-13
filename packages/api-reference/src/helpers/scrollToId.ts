import { useApiClientStore } from '@scalar/api-client'
import { nextTick } from 'vue'

const { setActiveSidebar } = useApiClientStore()

export const scrollToId = async (id: string) => {
  document.getElementById(id)?.scrollIntoView()

  await nextTick()

  setActiveSidebar(id)
}
