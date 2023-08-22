import { type Ref, onMounted, ref } from 'vue'

// Set a ref value on mount when needed to access properties that are not SSR friendly
export function useRefOnMount<T>(setter: () => T) {
  const value: Ref<T | null> = ref(null)

  onMounted(() => {
    value.value = setter()
  })

  return value
}
