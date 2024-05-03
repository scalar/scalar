<script setup lang="ts">
import {
  SecurityScheme,
  SecuritySchemeSelector,
  useAuthenticationStore,
} from '@scalar/api-client'
import type { SSRState } from '@scalar/oas-utils'
import type { OpenAPIV3_1 } from '@scalar/openapi-parser'
import { computed, onServerPrefetch, useSSRContext, watch } from 'vue'

import { hasSecuritySchemes, sleep } from '../../../helpers'
import type { Spec } from '../../../types'
import { Card, CardContent, CardHeader } from '../../Card'

const props = defineProps<{ parsedSpec?: Spec }>()

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
  <Card v-if="hasSecuritySchemes(parsedSpec)">
    <CardHeader
      borderless
      class="authentication-header"
      transparent>
      Authentication
      <template #actions>
        <div class="selector">
          <SecuritySchemeSelector
            :value="
              parsedSpec?.components?.securitySchemes
            "></SecuritySchemeSelector>
        </div>
      </template>
    </CardHeader>
    <CardContent
      v-if="showSecurityScheme"
      class="authentication-content"
      transparent>
      <SecurityScheme
        v-if="authentication.preferredSecurityScheme"
        :value="
          parsedSpec?.components?.securitySchemes?.[
            authentication.preferredSecurityScheme
          ] as OpenAPIV3_1.SecuritySchemeObject
        " />
    </CardContent>
  </Card>
</template>
<style scoped>
.authentication-header {
  white-space: nowrap;
}
.authentication-content {
  padding: 9px;
}
.selector {
  margin-right: 12px;
}
</style>
