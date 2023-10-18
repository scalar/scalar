<script setup lang="ts">
import { CodeMirror } from '@scalar/use-codemirror'

import { hasSecuritySchemes } from '../../../helpers'
import { type Spec } from '../../../types'
import {
  Section,
  SectionContainer,
  SectionContent,
  SectionHeader,
} from '../../Section'
import SecuritySchemes from './SecuritySchemes.vue'

defineProps<{ spec?: Spec }>()
</script>

<template>
  <SectionContainer>
    <Section
      v-if="hasSecuritySchemes(spec)"
      id="authentication">
      <SectionContent>
        <SectionHeader>Authentication</SectionHeader>

        <CodeMirror
          v-if="false"
          :content="JSON.stringify(spec?.components?.securitySchemes, null, 2)"
          :languages="['json']"
          readOnly />
        <SecuritySchemes :value="spec?.components?.securitySchemes" />
      </SectionContent>
    </Section>
  </SectionContainer>
</template>
