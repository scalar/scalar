import { type Ref, watch } from 'vue'

/**
 * Wait until the ref has a specific value
 */
export function waitFor(input: Ref<any>, expectedValue: any) {
  return new Promise<void>((resolve) => {
    const unwatch = watch(input, (newValue) => {
      if (newValue === expectedValue) {
        unwatch()
        resolve()
      }
    })
  })
}
