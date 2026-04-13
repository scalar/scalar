import ph from 'posthog-js'
import { type Ref, watch } from 'vue'

const posthog =
  typeof window !== 'undefined'
    ? ph.init('phc_3elIjSOvGOo5aEwg6krzIY9IcQiRubsBtglOXsQ4Uu4', {
        api_host: 'https://magic.scalar.com',
        ui_host: 'https://us.posthog.com',
        defaults: '2025-11-30',
        opt_out_capturing_by_default: true,
      })
    : null

posthog?.register({
  product: 'api-reference',
})

export const usePosthog = (enabled: Ref<boolean>) => {
  if (!posthog) {
    return
  }

  watch(
    enabled,
    (value) => {
      if (value) {
        posthog.opt_in_capturing()
      } else {
        posthog.opt_out_capturing()
      }
    },
    { immediate: true },
  )
}
