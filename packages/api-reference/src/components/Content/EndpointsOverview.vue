<script setup lang="ts">
import { nextTick } from 'vue'

import {
  getOperationSectionId,
  getTagSectionId,
  scrollToId,
} from '../../helpers'
import { useTemplateStore } from '../../stores/template'
import type { Tag, TransformedOperation } from '../../types'
import { Card, CardContent, CardHeader } from '../Card'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContent,
  SectionHeader,
} from '../Section'
import MarkdownRenderer from './MarkdownRenderer.vue'

const props = defineProps<{ tag: Tag }>()

const { setCollapsedSidebarItem } = useTemplateStore()

// We need to make sure the endpoint tag is open before
// we try to scroll to it
// we wait for next render after we open the tag
async function scrollHandler(operation: TransformedOperation) {
  setCollapsedSidebarItem(getTagSectionId(props.tag), true)
  await nextTick()
  scrollToId(getOperationSectionId(operation))
}
</script>
<template>
  <Section :id="getTagSectionId(tag)">
    <SectionContent>
      <SectionColumns>
        <SectionColumn>
          <SectionHeader>
            {{ tag.name }}
          </SectionHeader>
          <MarkdownRenderer :value="tag.description" />
        </SectionColumn>
        <SectionColumn>
          <template v-if="tag.operations?.length > 0">
            <Card>
              <CardHeader muted>Endpoints</CardHeader>
              <CardContent muted>
                <div class="endpoints custom-scroll">
                  <a
                    v-for="operation in tag.operations"
                    :key="getOperationSectionId(operation)"
                    class="endpoint"
                    @click="scrollHandler(operation)">
                    <span :class="operation.httpVerb">{{
                      operation.httpVerb
                    }}</span>
                    <span>{{ operation.path }}</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </template>
        </SectionColumn>
      </SectionColumns>
    </SectionContent>
  </Section>
</template>
<style scoped>
.endpoints {
  overflow: auto;
  background: var(--theme-background-2, var(--default-theme-background-2));
  padding: 10px 12px;
}
@media (max-width: 580px) {
  .endpoints {
    max-height: calc(100vh - 150px);
  }
}
.endpoints span + span {
  text-align: left;
  margin-left: 12px;
  text-transform: initial;
}
</style>
