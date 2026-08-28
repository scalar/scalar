// Theming — imported in the same order as .storybook/preview.ts so the cascade resolves identically
import '@scalar/themes/fonts.css'
import '@scalar/themes/style.css'

import { type App, type Component, createApp, h } from 'vue'

import '../../src/style.css'
import '../../.storybook/preview.css'
import './gallery.css'

import { type ThemeVariantId, applyThemeVariant, defaultThemeVariant } from '@scalar/helpers/storybook/themes'

/**
 * The component gallery that hosts Playwright's `mount()` fixture.
 *
 * Playwright navigates to this page and calls `window.mount({ story, props })`, then screenshots
 * `#root`. Both names are fixed by the fixture, so neither is ours to choose.
 *
 * Rather than keep a second set of stories in step with the first, the gallery renders the Storybook
 * CSF files the workbench already uses. That means reading the handful of CSF fields the stories
 * actually rely on — `render`, `args`, `component` and `parameters.layout` — and applying the same
 * body classes Storybook would, which is what keeps the committed snapshots comparable.
 */

/** The parts of a CSF module the gallery reads. Storybook's own types cover far more than we need. */
type StoryModule = {
  default: Meta
  [exportName: string]: Meta | Story
}

type Meta = {
  component?: Component
  render?: Render
  args?: Args
  parameters?: Parameters
}

type Story = {
  render?: Render
  args?: Args
  parameters?: Parameters
}

type Args = Record<string, unknown>

type Parameters = { layout?: Layout }

type Render = (args: Args) => Component

type Layout = 'padded' | 'fullscreen' | 'centered'

/** Body class Storybook applies per layout, and which our `gallery.css` styles. */
const LAYOUT_CLASSES = {
  padded: 'sb-main-padded',
  fullscreen: 'sb-main-fullscreen',
  centered: 'sb-main-centered',
} as const satisfies Record<Layout, string>

/** Storybook's default when a story sets no layout parameter. */
const DEFAULT_LAYOUT: Layout = 'padded'

const storyModules = import.meta.glob<StoryModule>('../../src/**/*.stories.ts')

/** Matches preview.ts, which sets these once when the Storybook preview boots. */
document.body.classList.add('scalar-app', 'light-mode', 'sb-show-main')

/** The story currently rendered into `#root`, kept so the next mount can tear it down. */
let app: App | null = null

/**
 * Finds the CSF module for a component.
 *
 * Every component's stories file is named after the component, so the component name is enough to
 * locate it without maintaining a separate id map.
 */
const loadStoryModule = (component: string): Promise<StoryModule> => {
  const entry = Object.entries(storyModules).find(([path]) => path.endsWith(`/${component}.stories.ts`))

  if (!entry) {
    throw new Error(`No stories file found for component "${component}" (looked for ${component}.stories.ts)`)
  }

  return entry[1]()
}

/**
 * Resolves a story export from its display name.
 *
 * Storybook derives "With Actions" from the `WithActions` export, so the gallery reverses that. No
 * story in this package overrides `name`, so the mapping stays unambiguous.
 */
const resolveStory = (module: StoryModule, component: string, storyName: string): Story => {
  const story = module[storyName.replace(/ /g, '')]

  if (!story || story === module.default) {
    throw new Error(`No story "${storyName}" exported from ${component}.stories.ts`)
  }

  return story
}

window.mount = async ({ story: storyId, props }) => {
  const [component, storyName] = storyId.split('/')

  if (!component || !storyName) {
    throw new Error(`Expected a story id of the form "Component/Story Name", received "${storyId}"`)
  }

  const module = await loadStoryModule(component)
  const meta = module.default
  const story = resolveStory(module, component, storyName)

  const args: Args = { ...meta.args, ...story.args, ...props }

  // Storybook sizes the preview body from the story's layout, and the snapshots are pinned to it
  const layout = story.parameters?.layout ?? meta.parameters?.layout ?? DEFAULT_LAYOUT
  document.body.classList.remove(...Object.values(LAYOUT_CLASSES))
  document.body.classList.add(LAYOUT_CLASSES[layout])

  // Applied before the story renders, so the theme is in place for the first paint
  applyThemeVariant(window.__scalarTheme ?? defaultThemeVariant)

  const render = story.render ?? meta.render
  const definition = render
    ? render(args)
    : {
        render: () => {
          if (!meta.component) {
            throw new Error(`${component}.stories.ts has neither a render function nor a component`)
          }
          return h(meta.component, args)
        },
      }

  app?.unmount()

  // Vue reports render errors to a handler instead of rejecting the mount, so hold onto the first
  // one and rethrow it. Without this a broken story screenshots as an empty page and silently passes.
  let renderError: unknown

  app = createApp(definition)
  app.config.errorHandler = (error) => {
    renderError ??= error
  }
  app.mount('#root')

  if (renderError) {
    throw renderError
  }

  // The Scalar fonts are served with font-display: swap, so text paints in a fallback face first
  await document.fonts.ready
  await new Promise((resolve) => requestAnimationFrame(resolve))
}

window.unmount = () => {
  app?.unmount()
  app = null
}

declare global {
  interface Window {
    /** Renders a story into `#root`. Called by Playwright's `mount()` fixture. */
    mount: (params: { story: string; props?: Args }) => Promise<void>
    /** Tears down the rendered story. Called by the locator's `unmount()`. */
    unmount: () => void
    /** Theme to render under, set by the test harness via `page.addInitScript`. */
    __scalarTheme?: ThemeVariantId
  }
}
