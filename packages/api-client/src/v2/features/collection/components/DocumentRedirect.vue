<script setup lang="ts">
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { onMounted } from 'vue'

import type { RouteProps } from '@/v2/features/app/helpers/routes'

const { document, eventBus } = defineProps<RouteProps>()

onMounted(() => {
  const path = Object.keys(document?.paths ?? {})[0]

  if (!path) {
    return eventBus.emit('ui:navigate', {
      page: 'document',
      path: 'overview',
    })
  }

  const method = Object.keys(document?.paths?.[path] ?? {}).filter(
    isHttpMethod,
  )[0]

  if (!method) {
    return eventBus.emit('ui:navigate', {
      page: 'document',
      path: 'overview',
    })
  }

  return eventBus.emit('ui:navigate', {
    page: 'example',
    path,
    method,
    exampleName: 'default',
  })
})
</script>
