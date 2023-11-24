import { computed, onActivated, onDeactivated, onMounted, ref } from 'vue'

/** This tells you if a component is active in a `<keepalive>` */
export function useActive() {
  const isActive = ref<boolean>(true)

  // Component is active on mount
  onMounted(() => (isActive.value = true))

  // Component was activated
  onActivated(() => (isActive.value = true))

  // Component was deactivated
  onDeactivated(() => (isActive.value = false))

  return {
    isActive: computed(() => isActive.value),
  }
}
