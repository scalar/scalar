<script setup lang="ts">
import type { OpenAPIV3_1 } from '@scalar/openapi-parser'
import { ref } from 'vue'

import { emitter } from '../../../../emitter'
import { useAuthenticationStore } from '../../../../stores'
import { CollapsibleSection } from '../../../CollapsibleSection'
import SecurityScheme from './SecurityScheme.vue'
import SecuritySchemeSelector from './SecuritySchemeSelector.vue'

const requestAuthenticationRef = ref<typeof HTMLDivElement | null>(null)

emitter.on('click.generated.parameter', () => {
  if (!requestAuthenticationRef.value) {
    return
  }

  const element = requestAuthenticationRef.value as unknown as HTMLDivElement

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  })
})

const { authentication } = useAuthenticationStore()
</script>
<template>
  <div ref="requestAuthenticationRef">
    <CollapsibleSection title="Authentication">
      <template #options>
        <SecuritySchemeSelector
          :value="authentication.securitySchemes"></SecuritySchemeSelector>
      </template>

      <div
        v-if="authentication.preferredSecurityScheme"
        class="preferred-security-scheme">
        <SecurityScheme
          :value="
            authentication.securitySchemes?.[
              authentication.preferredSecurityScheme
            ] as OpenAPIV3_1.SecuritySchemeObject
          " />
      </div>
    </CollapsibleSection>
  </div>
</template>

<style scoped>
.preferred-security-scheme {
  display: flex;
  width: 100%;
}
</style>
