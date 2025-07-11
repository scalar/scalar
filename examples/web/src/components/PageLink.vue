<script setup lang="ts">
import {
  ScalarCard,
  ScalarCardHeader,
  ScalarCardSection,
} from '@scalar/components'
import { RouterLink } from 'vue-router'

defineProps<{
  to?: string
  href?: string
}>()
</script>
<template>
  <RouterLink
    v-if="to"
    :to="{ name: to }">
    <ScalarCard>
      <ScalarCardHeader>
        <slot name="title" />
      </ScalarCardHeader>
      <ScalarCardSection class="description">
        <slot name="description" />
      </ScalarCardSection>
    </ScalarCard>
  </RouterLink>
  <a
    v-else-if="href"
    :href="href">
    <ScalarCard>
      <ScalarCardHeader>
        <slot name="title" />
      </ScalarCardHeader>
      <ScalarCardSection class="description">
        <slot name="description" />
      </ScalarCardSection>
    </ScalarCard>
  </a>
</template>

<style scoped>
a {
  text-decoration: none;
  color: var(--scalar-color-2);
}

.description {
  padding: 10px;
  min-height: 75px;
  font-size: var(--scalar-small);
  line-height: 1.5;
}
</style>
