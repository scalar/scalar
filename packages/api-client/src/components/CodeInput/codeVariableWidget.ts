import { parseEnvVariables } from '@/libs'
import { type EnvVariables, getEnvColor } from '@/libs/env-helpers'
import { ScalarButton, ScalarIcon, ScalarTooltip } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { REGEX } from '@scalar/oas-utils/helpers'
import {
  Decoration,
  type DecorationSet,
  EditorView,
  RangeSetBuilder,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@scalar/use-codemirror'
import { createApp, defineComponent, h } from 'vue'
import { nanoid } from 'nanoid'

/**
 * Displays the value of a variable of the active environment in a pill
 */
class PillWidget extends WidgetType {
  private app: any
  private uid: string
  environment: Environment | undefined
  envVariables: EnvVariables | undefined
  workspace: Workspace | undefined
  isReadOnly: boolean

  constructor(
    private variableName: string,
    environment: Environment | undefined,
    envVariables: EnvVariables | undefined,
    workspace: Workspace | undefined,
    isReadOnly: boolean | undefined,
  ) {
    super()
    this.variableName = variableName
    this.environment = environment
    this.envVariables = envVariables
    this.workspace = workspace
    this.isReadOnly = isReadOnly ?? false
    this.uid = nanoid()
  }

  toDOM() {
    const span = document.createElement('span')
    span.className = 'cm-pill'
    span.textContent = `${this.variableName}`

    const tooltipComponent = defineComponent({
      props: { variableName: { type: String, default: null } },
      render: () => {
        const val = this.envVariables
          ? parseEnvVariables(this.envVariables).find((thing) => thing.key === this.variableName)
          : undefined

        // Set the pill color based on the environment source or fallback to default color
        const isGlobal = val?.source === 'global'
        const pillColor = isGlobal ? '#FFFFFF' : val && this.environment ? getEnvColor(this.environment) : '#FFFFFF'

        span.style.setProperty('--tw-bg-base', pillColor)

        // Set opacity based on the existence of a value
        span.style.opacity = val?.value ? '1' : '0.5'

        // Tooltip trigger element
        const tooltipTrigger = h('div', { class: 'flex items-center gap-1 whitespace-nowrap' }, [
          (isGlobal || (this.environment?.name === 'No Environment' && val?.value)) &&
            h(ScalarIcon, { class: 'size-2.5 -ml-1', icon: 'Globe' }),
          h('span', this.variableName),
        ])

        const tooltipContent = val?.value
          ? h('div', { class: 'p-2' }, val.value)
          : h('div', { class: 'divide-y divide-1/2 grid' }, [
              h('span', { class: 'p-2 opacity-25' }, 'No value'),
              !this.isReadOnly &&
                h('div', { class: 'p-1' }, [
                  h(
                    ScalarButton,
                    {
                      class:
                        'gap-1.5 justify-start font-normal px-1 py-1.5 h-auto transition-colors rounded no-underline text-xxs w-full hover:bg-b-2',
                      variant: 'ghost',
                      onClick: () => {
                        // TODO: Use named route instead
                        window.location.href = `/workspace/${this.workspace?.uid}/environment`
                      },
                    },
                    {
                      default: () => [
                        h(ScalarIcon, {
                          class: 'w-2',
                          icon: 'Add',
                          size: 'xs',
                        }),
                        'Add variable',
                      ],
                    },
                  ),
                ]),
            ])

        return h(
          ScalarTooltip,
          {
            align: 'center',
            class: 'w-full',
            delay: 0,
            side: 'bottom',
            sideOffset: 6,
          },
          {
            trigger: () => tooltipTrigger,
            content: () =>
              h(
                'div',
                {
                  class: ['border w-content rounded bg-b-1 brightness-lifted text-xxs leading-5 text-c-1'],
                },
                tooltipContent,
              ),
          },
        )
      },
    })

    this.app = createApp(tooltipComponent, { variableName: this.variableName })
    this.app.mount(span)

    return span
  }

  override destroy() {
    if (this.app) {
      this.app.unmount()
    }
  }

  override eq(other: WidgetType) {
    return other instanceof PillWidget && other.variableName === this.variableName && other.uid === this.uid
  }

  override ignoreEvent() {
    return false
  }
}

/**
 * Styles the active environment variable pill
 */
export const pillPlugin = (props: {
  environment: Environment | undefined
  envVariables: EnvVariables | undefined
  workspace: Workspace | undefined
  isReadOnly: boolean | undefined
}) =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view)
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          requestAnimationFrame(() => {
            this.decorations = this.buildDecorations(update.view)
            update.view.update([])
          })
        }
      }

      buildDecorations(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>()

        for (const { from, to } of view.visibleRanges) {
          const text = view.state.doc.sliceString(from, to)
          let match

          while ((match = REGEX.VARIABLES.exec(text)) !== null) {
            const start = from + match.index
            const end = start + match[0].length
            const variableName = match[1] ?? ''
            builder.add(
              start,
              end,
              Decoration.widget({
                widget: new PillWidget(
                  variableName,
                  props.environment,
                  props.envVariables,
                  props.workspace,
                  props.isReadOnly,
                ),
                side: 1,
              }),
            )
          }
        }

        return builder.finish()
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  )

export const backspaceCommand = EditorView.domEventHandlers({
  keydown(event, view) {
    if (event.key === 'Backspace') {
      const { state } = view
      const { from, to } = state.selection.main

      // Prevent breaking line content addition on pill removal
      if (from === 0 && to === state.doc.length) {
        view.dispatch({
          changes: { from: 0, to: state.doc.length },
          selection: { anchor: 0 },
        })
        event.preventDefault()
        return true
      }

      if (from === to && from > 0) {
        const before = state.doc.sliceString(from - 2, from)
        if (before === '}}') {
          view.dispatch({
            changes: { from: from - 2, to },
            selection: { anchor: from - 2 },
          })
          event.preventDefault()
          return true
        }
      }
    }
    return false
  },
})
