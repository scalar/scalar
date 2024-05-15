<script lang="ts">
  import { onMount } from 'svelte'
  import { createScalarReferences } from '@scalar/api-reference'
  import type { ReferenceConfiguration } from '@scalar/api-reference'
  import { svelteThemeCss } from './theme'

  export let configuration: ReferenceConfiguration
  let el: HTMLDivElement | null = null

  const applyDefaultCss = (config: ReferenceConfiguration) => {
    if (!config?.customCss && !config?.theme) {
      config.customCss = svelteThemeCss
    }
  }

  const initializeApiReference = async () => {
    if (!el) return

    applyDefaultCss(configuration)
    const instance = createScalarReferences(el, configuration ?? {})

    /** unmount on cleanup */
    return () => instance.unmount()
  }

  onMount(() => {
    initializeApiReference().catch(error => {
      console.error('Failed to initialize API reference:', error)
    })
  })
</script>

<svelte:head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scalar API Reference</title>
</svelte:head>

<div bind:this={el}></div>
