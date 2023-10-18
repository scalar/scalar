<script setup lang="ts">
import { CodeMirror } from '@scalar/use-codemirror'

import { hasSecuritySchemes } from '../../../helpers'
import { useGlobalStore } from '../../../stores'
import { type Spec } from '../../../types'
import { Card, CardContent, CardHeader } from '../../Card'
import MarkdownRenderer from '../MarkdownRenderer.vue'
import SecurityScheme from './SecurityScheme.vue'
import SecuritySchemeSelector from './SecuritySchemeSelector.vue'

defineProps<{ spec?: Spec }>()

const { authentication } = useGlobalStore()
</script>

<template>
  <Card v-if="hasSecuritySchemes(spec)">
    <CardHeader>
      Authentication
      <template #actions>
        <div class="selector">
          <SecuritySchemeSelector
            :value="spec?.components?.securitySchemes"></SecuritySchemeSelector>
        </div>
      </template>
    </CardHeader>
    <CardContent
      v-if="
        authentication.securitySchemeKey &&
        !!spec?.components?.securitySchemes?.[authentication.securitySchemeKey]
          .type
      ">
      <div class="scheme">
        <SecurityScheme
          :value="
            spec?.components?.securitySchemes?.[
              authentication.securitySchemeKey
            ]
          " />
      </div>
    </CardContent>
    <!-- <CardContent>
            <CodeMirror
              v-if="true"
              :content="JSON.stringify(authentication, null, 2)"
              :languages="['json']"
              readOnly />
          </CardContent>
          <CardContent>
            <CodeMirror
              v-if="true"
              :content="JSON.stringify(authentication, null, 2)"
              :languages="['json']"
              readOnly />
          </CardContent> -->
  </Card>
</template>

<style scoped>
.scheme {
  padding: 12px 12px 10px;
}

.selector {
  margin-right: 12px;
}
</style>
