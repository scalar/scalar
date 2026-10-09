<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

import { documents } from '../documents'
import type { ExportResult, Manifest, Page } from '../types'

const initial = new URLSearchParams(window.location.search)
const documentId = ref<string>(
  documents.find((entry) => entry.id === initial.get('document'))?.id ??
    'galaxy',
)
const manifest = shallowRef<Manifest>()
const result = shallowRef<ExportResult>()
const page = ref<number>(0)
const mode = ref<'page' | 'linked' | 'full'>(
  initial.get('linked') === 'true' ? 'linked' : 'page',
)
const linked = ref<boolean>(initial.get('linked') === 'true')
const view = ref<'preview' | 'source'>('preview')
const search = ref<string>('')
const busy = ref<boolean>(false)
const error = ref<string>('')
const copied = ref<boolean>(false)
let pending: AbortController | undefined
const example = computed<(typeof documents)[number]>(
  () => documents.find((entry) => entry.id === documentId.value)!,
)
const pages = computed<(Page & { index: number })[]>(
  () =>
    manifest.value?.pages
      .map((entry, index) => ({ ...entry, index }))
      .filter((entry) =>
        entry.label.toLowerCase().includes(search.value.toLowerCase()),
      ) ?? [],
)
const statistics = computed<string>(() =>
  result.value
    ? `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(result.value.bytes / 1024)} KB · ${Math.round(result.value.milliseconds)} ms to export`
    : 'Choose an example to begin',
)
const filename = computed<string>(
  () =>
    `${documentId.value}-${mode.value === 'full' ? 'full' : `page-${page.value}`}${linked.value ? '-linked' : ''}.md`,
)

const request = async <T,>(url: string, signal: AbortSignal): Promise<T> => {
  const response = await fetch(url, { signal })
  const value = await response.json()
  if (!response.ok) throw new Error(value.error ?? 'Request failed')
  return value as T
}
const render = async (): Promise<void> => {
  if (!manifest.value) return
  pending?.abort()
  const controller = new AbortController()
  pending = controller
  busy.value = true
  error.value = ''
  copied.value = false
  result.value = undefined
  const query = new URLSearchParams({
    document: documentId.value,
    linked: String(linked.value),
  })
  if (mode.value !== 'full') query.set('page', String(page.value))
  try {
    const output = await request<ExportResult>(
      `/__markdown/render?${query}`,
      controller.signal,
    )
    if (!controller.signal.aborted) result.value = output
  } catch (cause) {
    if (!controller.signal.aborted)
      error.value = cause instanceof Error ? cause.message : 'Export failed'
  } finally {
    if (pending === controller) busy.value = false
  }
}
const load = async (): Promise<void> => {
  pending?.abort()
  const controller = new AbortController()
  pending = controller
  busy.value = true
  manifest.value = undefined
  result.value = undefined
  search.value = ''
  error.value = ''
  try {
    const value = await request<Manifest>(
      `/__markdown/document?document=${documentId.value}`,
      controller.signal,
    )
    if (controller.signal.aborted) return
    manifest.value = value
    const model = initial.get('model')
    const selectedModel = model
      ? value.pages.findIndex((entry) => entry.options.model === model)
      : -1
    page.value =
      selectedModel >= 0
        ? selectedModel
        : Math.max(
            0,
            value.pages.findIndex((entry) => entry.options.operation),
          )
    initial.delete('model')
    await render()
  } catch (cause) {
    if (!controller.signal.aborted)
      error.value =
        cause instanceof Error ? cause.message : 'Could not load document'
  } finally {
    if (pending === controller) busy.value = false
  }
}
const chooseMode = (value: 'page' | 'linked' | 'full'): void => {
  mode.value = value
  linked.value = value === 'linked'
  void render()
}
const copy = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(result.value?.markdown ?? '')
    copied.value = true
  } catch {
    error.value =
      'Could not copy. Use Download Markdown or select the text in the Markdown view.'
  }
}
const download = (): void => {
  if (!result.value) return
  const url = URL.createObjectURL(
    new Blob([result.value.markdown], { type: 'text/markdown;charset=utf-8' }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.value
  anchor.click()
  URL.revokeObjectURL(url)
}
onMounted(load)
onBeforeUnmount(() => pending?.abort())
</script>

<template>
  <main class="bg-b-1 text-c-1 min-h-screen font-sans">
    <header class="border-b px-6 py-5">
      <p class="text-c-2 text-xs font-medium">SCALAR / PLAYGROUND</p>
      <h1 class="mt-1 text-xl font-bold">OpenAPI to Markdown</h1>
      <p class="text-c-2 mt-2 text-sm">
        Explore individual pages, linked schemas, and complete API exports.
      </p>
    </header>
    <div class="grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside class="border-b p-6 lg:border-r lg:border-b-0">
        <label
          class="block text-sm font-medium"
          for="example"
          >Example document</label
        >
        <select
          id="example"
          v-model="documentId"
          class="bg-b-1 mt-2 w-full rounded border p-2 text-sm"
          @change="load">
          <option
            v-for="entry in documents"
            :key="entry.id"
            :value="entry.id">
            {{ entry.name }}
          </option>
        </select>
        <a
          class="text-c-accent mt-2 inline-block text-xs underline"
          :href="example.source"
          rel="noreferrer"
          target="_blank"
          >View original document ↗</a
        >
        <p
          v-if="manifest"
          class="text-c-2 mt-3 text-xs">
          {{ manifest.operations }} operations · {{ manifest.models }} models
        </p>
        <fieldset
          class="mt-7"
          :disabled="busy || !manifest">
          <legend class="text-sm font-medium">Export</legend>
          <div class="mt-2 flex flex-col gap-2">
            <ScalarButton
              :aria-pressed="mode === 'page'"
              :variant="mode === 'page' ? 'solid' : 'outlined'"
              @click="chooseMode('page')">
              Per-page
            </ScalarButton>
            <ScalarButton
              :aria-pressed="mode === 'linked'"
              :variant="mode === 'linked' ? 'solid' : 'outlined'"
              @click="chooseMode('linked')">
              Linked page
            </ScalarButton>
            <ScalarButton
              :aria-pressed="mode === 'full'"
              :variant="mode === 'full' ? 'solid' : 'outlined'"
              @click="chooseMode('full')">
              Full export
            </ScalarButton>
          </div>
          <label class="mt-4 flex items-center gap-2 text-sm"
            ><input
              v-model="linked"
              type="checkbox"
              @change="render" />Link shared schemas</label
          >
          <p class="text-c-2 mt-2 text-xs">
            Linked references open the corresponding model page. Full exports
            include every model.
          </p>
          <div
            v-if="mode !== 'full'"
            class="mt-6">
            <label
              class="block text-sm font-medium"
              for="search"
              >Find a page</label
            >
            <input
              id="search"
              v-model="search"
              class="bg-b-1 mt-2 w-full rounded border p-2 text-sm"
              placeholder="Method, path, or model…"
              type="search" />
            <label
              class="mt-3 block text-sm font-medium"
              for="page"
              >Page</label
            >
            <select
              id="page"
              v-model="page"
              class="bg-b-1 mt-2 w-full rounded border p-2 text-sm"
              @change="render">
              <option
                v-for="entry in pages"
                :key="entry.index"
                :value="entry.index">
                {{ entry.label }}
              </option>
            </select>
            <p
              v-if="!pages.length"
              class="text-c-2 mt-2 text-xs">
              No matching pages.
            </p>
          </div>
          <ScalarButton
            class="mt-6 w-full"
            variant="outlined"
            @click="render">
            Regenerate
          </ScalarButton>
        </fieldset>
        <p class="text-c-2 mt-6 text-xs">
          Galaxy is included locally. Other examples load their official
          documents on demand. Large exports can take a while.
        </p>
      </aside>
      <section
        :aria-busy="busy"
        aria-label="Markdown output"
        class="min-w-0">
        <div class="flex flex-wrap items-center gap-2 border-b px-6 py-3">
          <ScalarButton
            :aria-pressed="view === 'preview'"
            size="sm"
            :variant="view === 'preview' ? 'solid' : 'ghost'"
            @click="view = 'preview'">
            Preview
          </ScalarButton>
          <ScalarButton
            :aria-pressed="view === 'source'"
            size="sm"
            :variant="view === 'source' ? 'solid' : 'ghost'"
            @click="view = 'source'">
            Markdown
          </ScalarButton>
          <span
            aria-live="polite"
            class="text-c-2 text-xs"
            >{{ statistics }}</span
          >
          <div class="ml-auto flex gap-2">
            <span
              class="sr-only"
              role="status"
              >{{ copied ? 'Markdown copied to clipboard.' : '' }}</span
            >
            <ScalarButton
              :disabled="busy || !result"
              size="sm"
              variant="outlined"
              @click="copy">
              {{ copied ? 'Copied' : 'Copy' }}
            </ScalarButton>
            <ScalarButton
              :disabled="busy || !result"
              size="sm"
              variant="outlined"
              @click="download">
              Download
            </ScalarButton>
          </div>
        </div>
        <p
          v-if="busy"
          class="text-c-2 p-6 text-sm"
          role="status">
          Loading {{ example.name }} and generating your export…
        </p>
        <div
          v-if="error"
          class="border-c-danger text-c-danger m-6 rounded border p-4 text-sm"
          role="alert">
          <p>{{ error }}</p>
          <ScalarButton
            class="mt-3"
            size="sm"
            variant="outlined"
            @click="manifest ? render() : load()">
            Retry
          </ScalarButton>
        </div>
        <template v-if="result && !busy">
          <!-- Preview HTML is sanitized by the Markdown preview pipeline on the development server. -->
          <article
            v-if="view === 'preview'"
            class="markdown mx-auto max-w-[1000px] px-6 py-8"
            v-html="result.html" />
          <textarea
            v-else
            aria-label="Markdown source"
            class="bg-b-1 font-code text-c-1 min-h-[80vh] w-full resize-y p-6 text-sm"
            readonly
            spellcheck="false"
            :value="result.markdown" />
        </template>
      </section>
    </div>
  </main>
</template>
