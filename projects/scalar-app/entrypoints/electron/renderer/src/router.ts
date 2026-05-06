import { trackPageview } from 'fathom-client'

import { createAppRouter } from '@/features/app'

export const router: ReturnType<typeof createAppRouter> = createAppRouter('desktop')

// Hook into the router
router.afterEach((to) => {
  if (typeof to.name !== 'string') {
    return
  }

  trackPageview({
    // We don't need to know the path, the name of the route is enough.
    url: `https://scalar-${window.os}/${to.name}`,
  })
})
