<script setup lang="ts">
import {
  ScalarIconBookOpenText,
  ScalarIconEnvelopeSimple,
  ScalarIconFileText,
} from '@scalar/icons'

import ScalarMenuLink from './ScalarMenuLink.vue'
import ScalarMenuSection from './ScalarMenuSection.vue'
</script>
<template>
  <ScalarMenuSection>
    <template #title>Resources</template>
    <ScalarMenuLink
      href="mailto:support@scalar.com"
      :icon="ScalarIconEnvelopeSimple"
      target="_blank">
      Sales & Support
    </ScalarMenuLink>
    <ScalarMenuLink
      href="https://scalar.com/terms-and-conditions"
      :icon="ScalarIconFileText"
      target="_blank">
      Terms & Conditions
    </ScalarMenuLink>
    <ScalarMenuLink
      href="https://scalar.com/privacy-policy"
      :icon="ScalarIconBookOpenText"
      target="_blank">
      Privacy Policy
    </ScalarMenuLink>
  </ScalarMenuSection>
</template>
