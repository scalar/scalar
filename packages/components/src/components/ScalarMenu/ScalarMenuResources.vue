<script setup lang="ts">
import ScalarMenuLink from './ScalarMenuLink.vue'
import ScalarMenuSection from './ScalarMenuSection.vue'
</script>
<template>
  <ScalarMenuSection>
    <template #title>Resources</template>
    <ScalarMenuLink
      href="mailto:marc@scalar.com"
      target="_blank">
      Sales & Support
    </ScalarMenuLink>
    <ScalarMenuLink href="https://scalar.com/terms-and-conditions">
      Terms & Conditions
    </ScalarMenuLink>
    <ScalarMenuLink href="https://scalar.com/privacy-policy">
      Privacy Policy
    </ScalarMenuLink>
  </ScalarMenuSection>
</template>
