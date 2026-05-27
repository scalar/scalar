<script lang="ts" setup>
import { ScalarFormSection } from '@scalar/components/form'
import type { ExternalUrls } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import ApiReferenceToolbarBlurb from './ApiReferenceToolbarBlurb.vue'
import ApiReferenceToolbarPopover from './ApiReferenceToolbarPopover.vue'
import ApiReferenceToolbarRegisterButton from './ApiReferenceToolbarRegisterButton.vue'
import ApiReferenceToolbarShareRegister from './ApiReferenceToolbarShareRegister.vue'

const { workspace, externalUrls } = defineProps<{
  workspace: WorkspaceStore
  externalUrls: ExternalUrls
}>()
</script>

<template>
  <ApiReferenceToolbarPopover class="w-120">
    <template #label>Deploy</template>
    <ScalarFormSection>
      <template #label>Scalar Docs</template>
      <p class="text-c-2 mb-2 leading-normal">
        Deploy your documentation on Scalar, the modern documentation platform
        for your API and everything else.
      </p>
      <ApiReferenceToolbarShareRegister
        :externalUrls
        :workspace />
    </ScalarFormSection>
    <ScalarFormSection>
      <template #label>Ask AI</template>
      <p class="text-c-2 mb-2 leading-normal">
        Let your users ask questions about your API in plain English. Scalar's
        AI agent answers from your OpenAPI document and your docs.
      </p>
      <ApiReferenceToolbarRegisterButton
        :extraParams="{ createAgent: 'true' }"
        :externalUrls
        :workspace>
        Enable Ask AI
      </ApiReferenceToolbarRegisterButton>
      <ApiReferenceToolbarBlurb>
        Available on
        <a
          href="https://scalar.com/products/docs/getting-started"
          target="_blank"
          >Scalar Pro</a
        >.
      </ApiReferenceToolbarBlurb>
    </ScalarFormSection>
    <ScalarFormSection>
      <template #label>MCP Servers</template>
      <p class="text-c-2 mb-2 leading-normal">
        Expose your API as a Model Context Protocol server so AI assistants like
        Cursor and VS Code can call it on your users' behalf.
      </p>
      <ApiReferenceToolbarRegisterButton
        :extraParams="{ createMcp: 'true' }"
        :externalUrls
        :workspace>
        Create MCP Server
      </ApiReferenceToolbarRegisterButton>
      <ApiReferenceToolbarBlurb>
        Hosted by Scalar, generated from your OpenAPI document.
      </ApiReferenceToolbarBlurb>
    </ScalarFormSection>
  </ApiReferenceToolbarPopover>
</template>
