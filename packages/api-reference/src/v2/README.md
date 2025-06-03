# Reference V2

 Elements in this folder will be used for the incremental move to the V2 concept. 

Imports should use the `@v2/...` alias syntax

## Core Goals

- All state management is centralized in the workspace store. The workspace store is a light JSON defined wrapper around a set of `documents` which are pure JSON OpenAPI documents. The typescript types used internally will be looser than the strict OAS specification as we want to handle rendering malformed and invalid documents with minimal errors. 

- All rendering components are stateless. Portions of the workspace store are provided as props and any events are emitted via the event layer. `WorkspaceStore.vue` will handle all state updates from the events. Eventually this vue component will be merged into the top level APIReferences component. 

- All primary UI sections are built as "blocks" and are individually exported as consumable end-user UI elements. 

- All UI elements must use specific CSS classes to allow easy targeting in user themes. 


## Project structure

`/blocks` a domain folder for each block. This should include all vue components and .ts files required for the block. Only if code is truly shared should it be hoisted to the `helpers` or `components` folder

`/components` shared UI elements that multiple blocks may consume. 

`/events` event definitions for all custom events used. Vanilla HTML events are used to allow framework agnostic integrations

`/helpers` generic helper utilities (must have test coverage). Most business logic should live in .ts file in their block domain folder


## End Goal Example:

```vue
<script setup lang="ts">
/**
 * API Reference Base
 * 
 * This will be the standard populated layout for the API Reference. 
 * No state mutation occurs in this component.  
 * 
 * This element may be used in an external app where the entire workspace state is handled 
 * by a wrapping SPA. 
 * 
 */

import type { ScalarApiReferenceConfig } from './config';


const props = defineProps<{
  config: ScalarApiReferenceConfig
  /** Pointer to the reactive scalar workspace object.  */
  getWorkspace: () => Record<string, any>
  /** Handler to run during SSR. Allows users to control workspace pre-fetching as needed. */
  onServerPrefetch: () => void
}>()



if (!props.getWorkspace) {
  throw new Error('getWorkspace is required')
}

// The getWorkspace function is a pointer to the workspace object and is only run once
// A functional pointer is used to avoid passing as a prop which has performance implications
const workspace = props.getWorkspace()

/** Before navigate we async resolve any missing docs */
// router.on('navigate', () => {
//   if(!document.resolved) resolve()
// })

/** On scroll we progressively fetch the operations */
// scrollWatch(() => {
//   // Resolve the next n operations as we scroll
//   if(!resolved) resolve('active-operation')
//   if(inView) setActiveOperation('active-operation')
// })

/** Option to preload everything in the background */
// if(config.preload) {
//   // background fetch all operations
// }

</script>
<template>
  <ApiReferenceLayout :mode="'modern'">
    <template #header>
      <ApiReferenceHeader :config="{ ...somePartialConfig }" :info="workspace.activeDoc.info" />
    </template>
    <template #sidebar>
      <ApiReferenceSidebar 
        :active="{ type, path}" 
        :config="{
          ...selectedConfigProps
        }" 
        :document="workspace.activeDoc"
        @update:document="emit('update:document', $event)"
        @navigate="emit('navigate', $event)">
        <template #top>
          <ApiReferenceSearch />
        </template>
        <template #footer>
          <ApiReferenceSidebarFooter />
        </template>
      </ApiReferenceSidebar>
    </template>
    <template #description>
      <!-- Description: Each section has a id hash like #description/section-name -->
      <ApiReferenceDescription :config="config" :info="workspace.activeDoc.info" />
      <!-- Authentication -->
      <ApiReferenceAuthentication 
        :servers="workspace.activeDoc.servers"
        :security="workspace.activeDoc.security"
        @update:server="domEmit('update:server', $event)" 
        @update:auth="emit('update:auth', $event)" 
        @update:client="emit('update:client', $event)" />
    </template>
    <template #operations>
      <template v-for="path in workspace.activeDoc.paths" :key="operation.path">
        <template v-for="method in operation" :key="`${operation.path}:${method.method}`">
          <ApiReferenceOperation" 
            :config="{ ...partialConfigAsNeeded }" 
            :operation="method"
            :activeAuth="workspace.activeDoc['x-scalar-active-auth']"
            @update:auth="emit('update:auth', $event)"
            @open-client="emit('open-client', $event)"
            @update:client="emit('update:client', $event)" />
        </template>
      </template>
    </template>
    <template #models>
    </template>   
    <template #webhooks>
    </template>
    <!-- Client instance that will just work with the active properties from the workspace -->
    <ApiClient 
      :active-operation="workspace['x-scalar-active-operation']" 
      :active-document="workspace['x-scalar-active-document']" />
  </ApiReferenceLayout>
</template>
```