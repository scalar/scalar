<script lang="ts" setup>
import { ScalarIcon } from '@scalar/components/icon'
import { computed } from 'vue'

import { getMediaTypeConfig } from '@/v2/blocks/response-block/helpers/media-types'
import { useLocalization } from '@/v2/features/localization'

const props = defineProps<{
  href: string
  type?: string
  filename?: string
}>()

const { translate } = useLocalization()

const filenameExtension = computed(() => {
  const extension =
    getMediaTypeConfig(props.type ?? '')?.extension ?? '.unknown'
  return props.filename ? props.filename : `response${extension}`
})
</script>
<template>
  <a
    :aria-label="translate('apiClient.responseBodyDownload.download')"
    class="text-c-3 text-xxs hover:bg-b-3 flex items-center gap-1 rounded px-1.5 py-0.5 no-underline"
    :download="`${filenameExtension}`"
    :href="href"
    @click.stop>
    <ScalarIcon
      icon="Download"
      size="xs" />
    <span>
      <span>{{ translate('apiClient.responseBodyDownload.label') }}</span>
      <span class="sr-only">{{
        translate('apiClient.responseBodyDownload.body')
      }}</span>
    </span>
  </a>
</template>
