<script setup lang="ts">
import ScalarMenuLink from './ScalarMenuLink.vue'
import ScalarMenuSection from './ScalarMenuSection.vue'
</script>
<template>
  <ScalarMenuSection>
    <template #title>Resources</template>
    <ScalarMenuLink
      href="mailto:support@scalar.com"
      icon="Email"
      target="_blank">
      Sales & Support
    </ScalarMenuLink>
    <ScalarMenuLink
      href="https://scalar.com/terms-and-conditions"
      icon="DocsPage"
      target="_blank">
      Terms & Conditions
    </ScalarMenuLink>
    <ScalarMenuLink
      href="https://scalar.com/privacy-policy"
      icon="Changelog"
      target="_blank">
      Privacy Policy
    </ScalarMenuLink>
  </ScalarMenuSection>
</template>
