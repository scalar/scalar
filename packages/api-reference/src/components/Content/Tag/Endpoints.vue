<script setup lang="ts">
import { HttpMethod } from '@scalar/api-client'
import type { TransformedOperation } from '@scalar/oas-utils'

import { useNavState, useSidebar } from '../../../hooks'
import type { Tag } from '../../../types'
import { Anchor } from '../../Anchor'
import { Card, CardContent, CardHeader } from '../../Card'
import { MarkdownRenderer } from '../../MarkdownRenderer'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContent,
  SectionHeader,
} from '../../Section'

const props = defineProps<{ id?: string; tag: Tag }>()

const emit = defineEmits<{
  (event: 'observeAndNavigate', value: string): void
}>()

const { getOperationId, getTagId } = useNavState()
const { setCollapsedSidebarItem } = useSidebar()

const navigateToOperation = (operationId: string) => {
  emit('observeAndNavigate', operationId)
}

// TODO in V2 we need to do the same loading trick as the initial load
async function scrollHandler(operation: TransformedOperation) {
  navigateToOperation(getOperationId(operation, props.tag))
  setCollapsedSidebarItem(getTagId(props.tag), true)
}
</script>
<template>
  <Section
    :id="id"
    :label="tag.name.toUpperCase()">
    <SectionContent>
      <SectionColumns>
        <SectionColumn>
          <SectionHeader :level="2">
            <Anchor :id="getTagId(tag)">
              {{ tag.name }}
            </Anchor>
          </SectionHeader>
          <MarkdownRenderer
            :value="tag.description"
            withImages />
        </SectionColumn>
        <SectionColumn>
          <template v-if="tag.operations?.length > 0">
            <Card class="scalar-card-sticky">
              <CardHeader muted>Endpoints</CardHeader>
              <CardContent
                class="custom-scroll"
                muted>
                <div class="endpoints">
                  <a
                    v-for="operation in tag.operations"
                    :key="getOperationId(operation, tag)"
                    class="endpoint"
                    @click="scrollHandler(operation)">
                    <HttpMethod :method="operation.httpVerb" />
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
  background: var(--scalar-background-2);
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
.endpoint .post,
.endpoint .get,
.endpoint .delete,
.endpoint .put {
  white-space: nowrap;
}
.endpoint span {
  color: var(--scalar-color-1);
  min-width: 62px;
  display: inline-block;
  text-align: right;
  line-height: 1.55;
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-small);
  cursor: pointer;
}
</style>
