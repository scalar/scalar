import { onMounted } from 'vue'

/**
 * A hook that logs 'Hello World' to the console when mounted
 */
export function useHello() {
  onMounted(() => {
    console.log('Hello World')
  })
}
