<script setup lang="ts">
import { computed } from 'vue'

import { hasSecuritySchemes } from '../../../helpers'
import { useGlobalStore } from '../../../stores'
import { type Spec } from '../../../types'
import { Card, CardContent, CardHeader } from '../../Card'
import SecurityScheme from './SecurityScheme.vue'
import SecuritySchemeSelector from './SecuritySchemeSelector.vue'

const props = defineProps<{ spec?: Spec }>()

const { authentication } = useGlobalStore()

const showSecurityScheme = computed(() => {
  if (!authentication.securitySchemeKey) {
    return false
  }

  const scheme =
    props.spec?.components?.securitySchemes?.[authentication.securitySchemeKey]

  // @ts-ignore
  return !!scheme?.type
})
</script>

<template>
  <Card v-if="hasSecuritySchemes(spec)">
    <CardHeader transparent>
      Authentication
      <template #actions>
        <div class="selector">
          <SecuritySchemeSelector
            :value="spec?.components?.securitySchemes"></SecuritySchemeSelector>
        </div>
      </template>
    </CardHeader>
    <CardContent
      v-if="showSecurityScheme"
      transparent>
      <SecurityScheme
        v-if="authentication.securitySchemeKey"
        :value="
          spec?.components?.securitySchemes?.[authentication.securitySchemeKey]
        " />
    </CardContent>
  </Card>
</template>

<style scoped>
.selector {
  margin-right: 12px;
}
</style>
