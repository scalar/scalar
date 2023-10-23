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
  <Section
    :id="getTagSectionId(tag)"
    :label="tag.name.toUpperCase()">
    <SectionContent>
      <SectionColumns>
        <SectionColumn>
          <SectionHeader :level="2">
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

.endpoint {
  display: flex;
  white-space: nowrap;
  cursor: pointer;
}
.endpoint span:first-of-type {
  text-transform: uppercase;
}
.endpoint .post {
  color: var(--theme-color-green, var(--default-theme-color-green));
}
.endpoint .patch {
  color: var(--theme-color-yellow, var(--default-theme-color-yellow));
}
.endpoint .get {
  color: var(--theme-color-blue, var(--default-theme-color-blue));
}
.endpoint .delete {
  color: var(--theme-color-red, var(--default-theme-color-red));
}
.endpoint .put {
  color: var(--theme-color-orange, var(--default-theme-color-orange));
}
.endpoint .post,
.endpoint .get,
.endpoint .delete,
.endpoint .put {
  white-space: nowrap;
}
.endpoint span {
  color: var(--theme-color-1, var(--default-theme-color-1));
  min-width: 62px;
  display: inline-block;
  text-align: right;
  line-height: 1.55;
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  font-size: var(--theme-small, var(--default-theme-small));
  cursor: pointer;
}
</style>
