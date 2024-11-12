import { onBeforeUnmount } from 'vue'

/**
 * A hook that logs 'Hello World' to the console when mounted
 */
export function useGoodbye() {
  onBeforeUnmount(() => {
    console.log('Goodbye World')
  })
}
