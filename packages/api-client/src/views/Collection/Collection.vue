<script setup lang="ts">
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import { useActiveEntities } from '@/store'
import CollectionNavigation from '@/views/Collection/CollectionNavigation.vue'
import { RouterView } from 'vue-router'
</script>
<template>
  <ViewLayout class="flex md:flex-col">
    <CollectionNavigation />
    <ViewLayoutContent class="flex-1">
      <RouterView />
    </ViewLayoutContent>
  </ViewLayout>
</template>
<style scoped></style>
