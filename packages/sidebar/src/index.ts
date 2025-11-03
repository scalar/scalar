/** biome-ignore-all lint/performance/noBarrelFile: It's a library entrypoint */
import './style.css'

export { default as HttpMethod } from './components/HttpMethod.vue'
export { default as ScalarSidebar } from './components/ScalarSidebar.vue'
export { default as SidebarHttpBadge } from './components/SidebarHttpBadge.vue'
export { default as SidebarItem } from './components/SidebarItem.vue'
export {
  type SidebarState,
  createSidebarState,
} from './helpers/create-sidebar-state'
export { generateReverseIndex } from './helpers/generate-reverse-index'
export type { Item } from './types.ts'
