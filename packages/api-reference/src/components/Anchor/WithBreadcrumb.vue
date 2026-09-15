<script setup lang="ts">
const { breadcrumb } = defineProps<{
  breadcrumb?: string[]
}>()
</script>

<template>
  <template v-if="breadcrumb && breadcrumb.length > 0">
    <!-- `tabindex="-1"`: focusable programmatically but out of the tab order,
         so a deep link can move focus to its target instead of leaving keyboard
         and screen-reader users at the top of the document -->
    <div
      :id="breadcrumb.join('.')"
      class="static scroll-mt-24"
      tabindex="-1">
      <!-- Content -->
      <slot />
      <!-- No copy button here: the row's heading renders it as its last child
           so tab order matches visual order. See CopyLinkButton.vue -->
    </div>
  </template>
  <template v-else>
    <slot />
  </template>
</template>
