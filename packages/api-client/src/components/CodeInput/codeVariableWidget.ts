/* eslint-disable vue/one-component-per-file */
import type { WorkspaceStore } from '@/store/workspace'
import { ScalarButton, ScalarIcon, ScalarTooltip } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/workspace/environment'
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

const getEnvColor = (
  item:
    | {
        key: string
        value: string
      }
    | {
        _scalarEnvId: any
        key: string
        value: unknown
      },
  environments: Record<string, Environment>,
) => {
  if ('_scalarEnvId' in item) {
    return environments[item._scalarEnvId as string].color
  }
  // this is a server but we can eventually is a 🌐 icon
  return '#8E8E8E'
}

type ActiveParsedEnvironments = WorkspaceStore['activeParsedEnvironments']
type IsReadOnly = WorkspaceStore['isReadOnly']

class PillWidget extends WidgetType {
  private app: any
  environments: Record<string, Environment>
  activeParsedEnvironments: ActiveParsedEnvironments
  isReadOnly: IsReadOnly

  constructor(
    private variableName: string,
    environments: Record<string, Environment>,
    activeParsedEnvironments: ActiveParsedEnvironments,
    isReadOnly: IsReadOnly,
  ) {
    super()
    this.variableName = variableName
    this.environments = environments
    this.activeParsedEnvironments = activeParsedEnvironments
    this.isReadOnly = isReadOnly
  }

  toDOM() {
    const span = document.createElement('span')
    span.className = 'cm-pill'
    span.textContent = `${this.variableName}`

    const tooltipComponent = defineComponent({
      props: { variableName: { type: String, default: null } },
      render: () => {
        const val = this.activeParsedEnvironments.value.find(
          (thing) => thing.key === this.variableName,
        )
        if (val) {
          span.style.setProperty(
            '--tw-bg-base',
            getEnvColor(val, this.environments),
          )
        }
        const tooltipContent = val
          ? h('div', { class: 'p-2' }, val.value as string)
          : h('div', { class: 'divide-y divide-1/2 grid' }, [
              h('span', { class: 'p-2' }, 'Variable not found'),
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
                      h(ScalarIcon, { class: 'w-2', icon: 'Add', size: 'xs' }),
                      'Add variable',
                    ],
                  ),
                ]),
            ])

        return h(
          ScalarTooltip,
          {
            align: 'start',
            class: 'bg-b-1 w-full',
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
                  class:
                    'w-content shadow-lg rounded bg-b-1 text-xxs leading-5 text-c-1',
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

export const pillPlugin = (props: {
  environments: Record<string, Environment>
  activeParsedEnvironments: ActiveParsedEnvironments
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
          const regex = /{{(.*?)}}/g
          let match

          while ((match = regex.exec(text)) !== null) {
            const start = from + match.index
            const end = start + match[0].length
            const variableName = match[1]
            builder.add(
              start,
              end,
              Decoration.widget({
                widget: new PillWidget(
                  variableName,
                  props.environments,
                  props.activeParsedEnvironments,
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
