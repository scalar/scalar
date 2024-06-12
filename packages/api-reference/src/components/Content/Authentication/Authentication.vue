<script setup lang="ts">
import {
  SecurityScheme,
  SecuritySchemeSelector,
  useAuthenticationStore,
} from '@scalar/api-client'
import type { SSRState, Spec } from '@scalar/oas-utils'
import type { OpenAPIV3_1 } from '@scalar/openapi-parser'
import { computed, onServerPrefetch, useSSRContext, watch } from 'vue'

import { hasSecuritySchemes, sleep } from '../../../helpers'

const props = defineProps<{ parsedSpec?: Spec; proxy?: string }>()

const { authentication, setAuthentication } = useAuthenticationStore()

const showSecurityScheme = computed(() => {
  if (!authentication.preferredSecurityScheme) {
    return false
  }

  const scheme =
    props.parsedSpec?.components?.securitySchemes?.[
      authentication.preferredSecurityScheme
    ]

  return !!scheme && 'type' in scheme && !!scheme.type
})

// Keep a copy of the security schemes in the global authentication state
watch(
  () => props.parsedSpec?.components?.securitySchemes,
  () => {
    setAuthentication({
      securitySchemes: props.parsedSpec?.components?.securitySchemes,
    })
  },
  { deep: true, immediate: true },
)

// SSR hack - waits for the computed to complete and store in state
onServerPrefetch(async () => {
  const ctx = useSSRContext<SSRState>()
  await sleep(1)
  ctx!.payload.data['useGlobalStore-authentication'] = authentication
})
</script>

<template>
  <div v-if="hasSecuritySchemes(parsedSpec)">
    <div class="authentication-header">
      <!-- <template #actions> -->
      <div class="selector">
        <SecuritySchemeSelector
          :value="
            parsedSpec?.components?.securitySchemes
          "></SecuritySchemeSelector>
      </div>
      <!-- </template> -->
    </div>
    <div
      v-if="showSecurityScheme"
      class="authentication-content">
      <SecurityScheme
        v-if="authentication.preferredSecurityScheme"
        :proxy="proxy"
        :value="
          parsedSpec?.components?.securitySchemes?.[
            authentication.preferredSecurityScheme
          ] as OpenAPIV3_1.SecuritySchemeObject
        " />
    </div>
  </div>
</template>
<style scoped>
.authentication-header {
  white-space: nowrap;
}
.selector {
  margin-bottom: 6px;
}
</style>
