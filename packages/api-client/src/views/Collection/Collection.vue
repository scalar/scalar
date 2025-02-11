<script setup lang="ts">
import Sidebar from '@/components/Sidebar/Sidebar.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useActiveEntities } from '@/store'
import CollectionInfoForm from '@/views/Collection/CollectionInfoForm.vue'

const { activeCollection } = useActiveEntities()
</script>
<template>
  <ViewLayout>
    <Sidebar :title="activeCollection?.info?.title || 'Untitled Collection'">
      <template #content></template>
    </Sidebar>
    <ViewLayoutContent class="flex-1">
      <ViewLayoutSection>
        <template #title>Overview</template>
        <CollectionInfoForm />
      </ViewLayoutSection>
    </ViewLayoutContent>
  </ViewLayout>
</template>
<style scoped></style>
