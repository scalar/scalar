import './style.css'

/** biome-ignore-all lint/performance/noBarrelFile: It's a library entrypoint */
export { default as ScalarSidebar } from './components/ScalarSidebar.vue'
export type { Item } from './components/SidebarItem.vue'
export {
  type SidebarState,
  createSidebarState,
} from './helpers/create-sidebar-state'
export { generateReverseIndex } from './helpers/generate-reverse-index'
