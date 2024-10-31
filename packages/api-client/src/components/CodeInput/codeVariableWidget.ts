/* eslint-disable vue/one-component-per-file */
import { parseEnvVariables } from '@/libs'
import type { WorkspaceStore } from '@/store'
import { ScalarButton, ScalarIcon, ScalarTooltip } from '@scalar/components'
import { variableRegex } from '@scalar/oas-utils/helpers'
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

type ActiveEnvironment = WorkspaceStore['activeEnvironment']
type ActiveParsedEnvironments = WorkspaceStore['activeEnvVariables']
type IsReadOnly = WorkspaceStore['isReadOnly']

const getEnvColor = (activeEnvironment: ActiveEnvironment) => {
  if (activeEnvironment.value) {
    return activeEnvironment.value.color
  }

  return '#8E8E8E'
}

/**
 * Displays the value of a variable of the active environment in a pill
 */
class PillWidget extends WidgetType {
  private app: any
  activeEnvironment: ActiveEnvironment
  activeEnvVariables: ActiveParsedEnvironments
  isReadOnly: IsReadOnly

  constructor(
    private variableName: string,
    activeEnvironment: ActiveEnvironment,
    activeEnvVariables: ActiveParsedEnvironments,
    isReadOnly: IsReadOnly,
  ) {
    super()
    this.variableName = variableName
    this.activeEnvironment = activeEnvironment
    this.activeEnvVariables = activeEnvVariables
    this.isReadOnly = isReadOnly
  }

  toDOM() {
    const span = document.createElement('span')
    span.className = 'cm-pill'
    span.textContent = `${this.variableName}`

    const tooltipComponent = defineComponent({
      props: { variableName: { type: String, default: null } },
      render: () => {
        const val = parseEnvVariables(this.activeEnvVariables.value).find(
          (thing) => thing.key === this.variableName,
        )

        // Set the pill color based on the environment or fallback to grey
        const pillColor =
          val && this.activeEnvironment.value
            ? getEnvColor(this.activeEnvironment)
            : '#8E8E8E'

        span.style.setProperty('--tw-bg-base', pillColor)

        // Set opacity based on the existence of a value
        span.style.opacity = val?.value ? '1' : '0.5'

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
                        window.location.href = '/environment'
                      },
                    },
                    [
                      h(ScalarIcon, {
                        class: 'w-2',
                        icon: 'Add',
                        size: 'xs',
                      }),
                      'Add variable',
                    ],
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
            trigger: () => h('span', `${this.variableName}`),
            content: () =>
              h(
                'div',
                {
                  class: [
                    'border w-content rounded  bg-b-1 brightness-lifted text-xxs leading-5 text-c-1',
                    val?.value ? 'border-solid' : 'border-dashed',
                  ],
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

  destroy() {
    if (this.app) {
      this.app.unmount()
    }
  }

  eq(other: WidgetType) {
    return (
      other instanceof PillWidget && other.variableName === this.variableName
    )
  }

  ignoreEvent() {
    return false
  }
}

/**
 * Styles the active environment variable pill
 */
export const pillPlugin = (props: {
  activeEnvironment: WorkspaceStore['activeEnvironment']
  activeEnvVariables: ActiveParsedEnvironments
  isReadOnly: IsReadOnly
}) =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view)
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view)
        }
      }

      buildDecorations(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>()

        for (const { from, to } of view.visibleRanges) {
          const text = view.state.doc.sliceString(from, to)
          let match

          while ((match = variableRegex.exec(text)) !== null) {
            const start = from + match.index
            const end = start + match[0].length
            const variableName = match[1]
            builder.add(
              start,
              end,
              Decoration.widget({
                widget: new PillWidget(
                  variableName,
                  props.activeEnvironment,
                  props.activeEnvVariables,
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
