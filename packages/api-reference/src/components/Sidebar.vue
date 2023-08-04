<script setup lang="ts">
import { generateRequest, useApiClientRequestStore } from '@scalar/api-client'
import { useApiClientStore } from '@scalar/api-client'
import { useOperation } from '@scalar/api-client'
import { useMediaQuery } from '@vueuse/core'

import FindAnythingButton from '@lib/composed/FindAnythingButton.vue'
import SidebarElement from '@lib/composed/SidebarElement.vue'
import SidebarGroup from '@lib/composed/SidebarGroup.vue'

import { DocumentClasses } from '@guide/index'

import { useTemplateStore } from '../stores/template'
import type { Operation, Spec } from '../types'

const props = defineProps<{ spec: Spec }>()

const { state, setActiveSidebar, toggleApiClient } = useApiClientStore()

const { setActiveRequest } = useApiClientRequestStore()

function showItemInClient(operation: Operation) {
  const { parameterMap } = useOperation({ operation })
  const item = generateRequest(
    operation,
    parameterMap.value,
    props.spec.servers[0],
  )
  setActiveRequest(item)
  toggleApiClient(item, true)
}

const scrollToEndpoint = (item: Operation) => {
  setActiveSidebar(item.operationId)
  if (state.showApiClient) {
    showItemInClient(item)
  }
  document.getElementById(`endpoint/${item.operationId}`)?.scrollIntoView()
}

const isMobile = useMediaQuery('(max-width: 1000px)')

const {
  state: templateState,
  setItem: setTemplateItem,
  toggleCollapsedSidebarItem,
  setCollapsedSidebarItem,
} = useTemplateStore()
</script>
<template>
  <div
    class="sidebar"
    :class="DocumentClasses.Sidebar">
    <FindAnythingButton
      v-if="!isMobile"
      @click="setTemplateItem('showSearch', true)" />
    <div class="pages custom-scroll custom-scroll-self-contain-overflow">
      <SidebarGroup :level="0">
        <template v-for="tag in spec.tags">
          <SidebarElement
            v-if="tag.operations.length > 0"
            :key="tag.name"
            :hasChildren="true"
            :isActive="false"
            :item="{
              uid: '',
              title: tag.name.toUpperCase(),
              type: 'Folder',
            }"
            :open="templateState.collapsedSidebarItems[tag.name]"
            @select="() => toggleCollapsedSidebarItem(tag.name)"
            @toggleOpen="toggleCollapsedSidebarItem(tag.name)">
            <SidebarGroup :level="0">
              <SidebarElement
                v-for="operation in tag.operations"
                :key="operation.operationId"
                :isActive="state.activeSidebar === operation.operationId"
                :item="{
                  uid: '',
                  title: operation.name,
                  type: 'Page',
                }"
                @select="
                  () => {
                    setCollapsedSidebarItem(tag.name, true)
                    scrollToEndpoint(operation)
                  }
                " />
            </SidebarGroup>
          </SidebarElement>
        </template>
      </SidebarGroup>
    </div>
  </div>
</template>
