<script lang="ts" setup>
import { ref, watch } from 'vue'

import { scrollToId } from '../../../helpers'
import { useNavState } from '../../../hooks'
import type {
  Server,
  Spec,
  Tag as TagType,
  TransformedOperation,
} from '../../../types'
import { Anchor } from '../../Anchor'
import {
  Section,
  SectionContainer,
  SectionContent,
  SectionHeader,
} from '../../Section'
import { Operation } from '../Operation'
import { Schema } from '../Schema'
import { Tag } from '../Tag'
import { lazyBus } from './Lazy.vue'

/**
 * Loads a "fake" tag/modal/operation if the user is deep linking
 * The fake popup is then hidden once the real one loads behind it
 * Giving a seemless instant load experience
 *
 * @link https://medium.com/js-dojo/lazy-rendering-in-vue-to-improve-performance-dcccd445d5f

 * TODO list
 * - only works on first load, but we will use this when 
 *   hitting endpoint links in V2
 * - only works for default layout, add accordion (if we need)
 * - code is ripe for refactor as it is duplicated from content and models
 * - need to handle case of last operation/model
 */
const props = withDefaults(
  defineProps<{
    layout?: 'accordion' | 'default'
    parsedSpec: Spec
    server: Server
  }>(),
  { layout: 'default' },
)

const hideTag = ref(false)
const isLoading = ref(
  typeof window !== 'undefined' &&
    !!window.location.hash &&
    props.layout !== 'accordion',
)
const tags = ref<(TagType & { lazyOperations: TransformedOperation[] })[]>([])
const models = ref<string[]>([])

const { getModelId, getSectionId, getTagId, hash } = useNavState()

// Ensure we have a spec loaded
watch(
  () => props.parsedSpec.tags?.length,
  (tagsLength) => {
    if (!hash.value || typeof tagsLength !== 'number' || !props.parsedSpec.tags)
      return

    const sectionId = getSectionId()

    // Grab specific tag to load
    if (sectionId.startsWith('tag')) {
      let operationsIndex = 0
      const tagsIndex =
        props.parsedSpec.tags?.findIndex(
          (tag) => getTagId(tag) === sectionId,
        ) ?? 0

      // Grab specific operation to load
      const operationMatches = hash.value.match(/tag\/([^/]+)\/([^/]+)\/(.+)/)
      if (operationMatches?.length === 4) {
        const matchedVerb = operationMatches[2]
        const matchedPath = '/' + operationMatches[3]

        operationsIndex = props.parsedSpec.tags[
          tagsIndex
        ]?.operations.findIndex(
          ({ httpVerb, path }) =>
            matchedVerb === httpVerb && matchedPath === path,
        )
      }
      // Add a few tags to the loading section
      const tag = props.parsedSpec.tags[tagsIndex]
      hideTag.value = sectionId !== hash.value && sectionId.startsWith('tag')

      tags.value.push({
        ...tag,
        lazyOperations: tag.operations.slice(
          operationsIndex,
          operationsIndex + 2,
        ),
      })
    }
    // Models
    else {
      const modelKeys = Object.keys(props.parsedSpec.components?.schemas ?? {})
      const [, modelKey] = hash.value.toLowerCase().split('/')

      // Find the right model to start at
      const modelsIndex = modelKeys.findIndex(
        (key) => key.toLowerCase() === modelKey,
      )
      if (modelsIndex === -1) return

      // Display a couple models
      models.value = modelKeys.slice(modelsIndex, modelsIndex + 3)
    }
  },
  { immediate: true },
)

// Scroll to hash when component has rendered
const unsubscribe = lazyBus.on(({ id }) => {
  const hashStr = hash.value
  if (!hashStr || id !== hashStr) return

  // Unsubscribe once our element has loaded
  unsubscribe()

  // Timeout is to allow codemirror to finish loading and prevent layout shift
  // since we are already showing the docs this is inconsequential
  setTimeout(() => {
    scrollToId(hashStr)
    isLoading.value = false
  }, 500)
})
</script>
<template>
  <div
    v-show="isLoading"
    class="references-loading"
    :class="{
      'references-loading-hidden-tag': hideTag,
      'references-loading-top-spacer': tags.length,
    }">
    <!-- Tags -->
    <template
      v-for="tag in tags"
      :key="tag.id">
      <Tag
        v-if="tag.operations && tag.operations.length > 0"
        :spec="parsedSpec"
        :tag="tag">
        <Operation
          v-for="operation in tag.lazyOperations"
          :key="`${operation.httpVerb}-${operation.operationId}`"
          :operation="operation"
          :server="server"
          :tag="tag" />
      </Tag>
    </template>

    <!-- Models -->
    <SectionContainer v-if="models.length">
      <Section
        v-for="name in models"
        :key="name"
        :label="name">
        <template v-if="parsedSpec.components?.schemas?.[name]">
          <SectionContent>
            <SectionHeader :level="2">
              <Anchor :id="getModelId(name)">
                {{
                  (parsedSpec.components?.schemas?.[name] as any).title ?? name
                }}
              </Anchor>
            </SectionHeader>
            <Schema
              :name="name"
              noncollapsible
              :value="parsedSpec.components?.schemas?.[name]" />
          </SectionContent>
        </template>
      </Section>
    </SectionContainer>
  </div>
</template>
<style>
.references-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  grid-area: rendered;
  background: var(--theme-background-1, var(--default-theme-background-1));
}
.references-loading-top-spacer {
  top: calc(var(--refs-header-height) - 1px);
}
.references-loading-hidden-tag .section-container .section:first-child {
  display: none;
}
</style>
