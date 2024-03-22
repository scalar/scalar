<script setup lang="ts">
import { type OpenAPIV3_1 } from '@scalar/openapi-parser'

import { useAuthenticationStore } from '../../../../stores'
import { CollapsibleSection } from '../../../CollapsibleSection'
import SecurityScheme from './SecurityScheme.vue'
import SecuritySchemeSelector from './SecuritySchemeSelector.vue'

const { authentication } = useAuthenticationStore()
</script>
<template>
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
</template>

<style scoped>
.preferred-security-scheme {
  display: flex;
  width: 100%;
}
</style>
