import { useWorkspace } from '@/store/workspace'
import { RangeSetBuilder } from '@codemirror/state'
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view'
import { ScalarTooltip } from '@scalar/components'
import { computed, createApp, defineComponent, h } from 'vue'

const { environments } = useWorkspace()

const parsedEnvironments = computed(() => {
  return Object.values(environments)
    .map((env) => {
      try {
        return {
          _scalarEnvId: env.uid,
          ...JSON.parse(env.raw),
        }
      } catch {
        return null
      }
    })
    .filter((env) => env)
    .flatMap((obj) =>
      Object.entries(obj).flatMap(([key, value]) => {
        // Exclude the _scalarEnvId from the key-value pairs
        if (key !== '_scalarEnvId') {
          return [{ _scalarEnvId: obj._scalarEnvId, key, value }]
        }
        return []
      }),
    )
})

class PillWidget extends WidgetType {
  constructor(private variableName: string) {
    super()
  }

  toDOM() {
    const span = document.createElement('span')
    span.className = 'cm-pill'
    span.textContent = `{{${this.variableName}}}`

    const tooltipComponent = defineComponent({
      props: ['variableName'],
      render() {
        const val = parsedEnvironments.value.find(
          (thing) => thing.key === this.variableName,
        )
        const tooltipContent = val
          ? (val.value as string)
          : 'Variable not found'

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
            trigger: () => h('span', `{{${this.variableName}}}`),
            content: () =>
              h(
                'div',
                {
                  class:
                    'pointer-events-none w-content shadow-lg rounded bg-b-1 p-2 text-xxs leading-5 text-c-1',
                },
                tooltipContent,
              ),
          },
        )
      },
    })

    createApp(tooltipComponent, { variableName: this.variableName }).mount(span)

    return span
  }

  eq(other: WidgetType) {
    return (
      other instanceof PillWidget && other.variableName === this.variableName
    )
  }

  ignoreEvent(event: Event) {
    return false
  }
}

export const pillPlugin = ViewPlugin.fromClass(
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
              widget: new PillWidget(variableName),
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
