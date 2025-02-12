<script setup lang="ts">
import Sidebar from '@/components/Sidebar/Sidebar.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { useActiveEntities } from '@/store'
import CollectionSidebar from '@/views/Collection/CollectionSidebar.vue'
import { RouterView } from 'vue-router'

const { activeCollection } = useActiveEntities()
</script>
<template>
  <ViewLayout>
    <Sidebar :title="activeCollection?.info?.title || 'Untitled Collection'">
      <template #content>
        <CollectionSidebar />
      </template>
    </Sidebar>
    <ViewLayoutContent class="flex-1">
      <RouterView />
    </ViewLayoutContent>
  </ViewLayout>
</template>
<style scoped></style>
