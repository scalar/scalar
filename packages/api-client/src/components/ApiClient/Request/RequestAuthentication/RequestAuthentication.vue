<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import type { OpenAPIV3_1 } from '@scalar/openapi-parser'
import { ref } from 'vue'

import { clickGeneratedParameter } from '../../../../clientBus'
import { useAuthenticationStore } from '../../../../stores'
import { CollapsibleSection } from '../../../CollapsibleSection'
import SecurityScheme from './SecurityScheme.vue'
import SecuritySchemeSelector from './SecuritySchemeSelector.vue'

const requestAuthenticationRef = ref<typeof HTMLDivElement | null>(null)

clickGeneratedParameter.on(() => {
  if (!requestAuthenticationRef.value) {
    return
  }

  const element = requestAuthenticationRef.value as unknown as HTMLDivElement

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  })
})

const { authentication, setAuthentication } = useAuthenticationStore()

// When there are no security schemes in the spec, we add blank ones
const setIntialScheme = (
  preferredSecurityScheme: 'apiKey' | 'httpBasic' | 'httpBearer' | 'oauth2',
) => {
  setAuthentication({
    customSecurity: true,
    preferredSecurityScheme,
    securitySchemes: {
      apiKey: { type: 'apiKey', name: 'apiKey', in: 'header' },
      httpBasic: { type: 'http', scheme: 'basic' },
      httpBearer: { type: 'http', scheme: 'bearer' },
      // TODO oauth2
    },
  })
}
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

      <div
        v-if="!authentication.securitySchemes"
        class="security-scheme-empty-state">
        <ScalarButton
          variant="outlined"
          @click="setIntialScheme('apiKey')"
          >ApiKey</ScalarButton
        >
        <ScalarButton
          variant="outlined"
          @click="setIntialScheme('httpBasic')"
          >Basic</ScalarButton
        >
        <ScalarButton
          variant="outlined"
          @click="setIntialScheme('httpBearer')"
          >Bearer</ScalarButton
        >
        <ScalarButton
          variant="outlined"
          @click="setIntialScheme('oauth2')"
          >oAuth2</ScalarButton
        >
      </div>
    </CollapsibleSection>
  </div>
</template>

<style scoped>
.preferred-security-scheme {
  display: flex;
  width: 100%;
}

.security-scheme-empty-state {
  flex-wrap: wrap;
  gap: 16px;
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: space-around;

  .scalar-button {
    width: 100px;
  }
}
</style>
