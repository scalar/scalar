<script setup lang="ts">
import {
  getOperationSectionId,
  getTagSectionId,
  scrollToId,
} from '../../helpers'
import type { Tag } from '../../types'
import { Card, CardContent, CardHeader } from '../Card'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContent,
  SectionHeader,
} from '../Section'
import MarkdownRenderer from './MarkdownRenderer.vue'

defineProps<{ tag: Tag }>()
</script>

<template>
  <Section :id="getTagSectionId(tag)">
    <SectionHeader>
      {{ tag.name }}
    </SectionHeader>
    <SectionContent>
      <SectionColumns>
        <SectionColumn>
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
                    @click="scrollToId(getOperationSectionId(operation))">
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
