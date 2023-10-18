<script setup lang="ts">
import { CodeMirror } from '@scalar/use-codemirror'

import { hasSecuritySchemes } from '../../../helpers'
import { useGlobalStore } from '../../../stores'
import { type Spec } from '../../../types'
import {
  Section,
  SectionContainer,
  SectionContent,
  SectionHeader,
} from '../../Section'
import SecuritySchemes from './SecuritySchemes.vue'

defineProps<{ spec?: Spec }>()

const { authentication } = useGlobalStore()
</script>

<template>
  <SectionContainer>
    <Section
      v-if="hasSecuritySchemes(spec)"
      id="authentication">
      <SectionContent>
        <SectionHeader>Authentication</SectionHeader>
        <SecuritySchemes :value="spec?.components?.securitySchemes" />
        <div v-if="false">
          Configuration
          <CodeMirror
            :content="
              JSON.stringify(spec?.components?.securitySchemes, null, 2)
            "
            :languages="['json']"
            readOnly />
        </div>
        <div v-if="false">
          State
          <CodeMirror
            v-if="true"
            :content="JSON.stringify(authentication, null, 2)"
            :languages="['json']"
            readOnly />
        </div>
      </SectionContent>
    </Section>
  </SectionContainer>
</template>
