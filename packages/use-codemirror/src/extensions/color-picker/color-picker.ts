/**
 * Adapted from @replit/codemirror-css-color-picker 6.3.0 (MIT).
 * Upstream: https://github.com/replit/Codemirror-CSS-color-picker/tree/2eb228cdf8140b0bb586f5c561cf5347d05d4cc6
 * Copyright (c) Faris Masad and contributors. See THIRD_PARTY_NOTICES in this package.
 */

import { syntaxTree } from '@codemirror/language'
import type { Extension, Range, Text } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate, WidgetType } from '@codemirror/view'
import { NodeProp, type Tree } from '@lezer/common'

import { namedColors } from './named-colors'

type PickerState = {
  from: number
  to: number
  alpha: string
  colorType: ColorType
}

type WidgetOptions = PickerState & {
  color: string
}

type ColorData = Omit<WidgetOptions, 'from' | 'to'>

const pickerState = new WeakMap<HTMLInputElement, PickerState>()

type ColorType = 'RGB' | 'HEX' | 'NAMED' | 'HSL'

const rgbCallExpRegex = /rgb(?:a)?\(\s*(\d{1,3}%?)\s*,?\s*(\d{1,3}%?)\s*,?\s*(\d{1,3}%?)\s*([,/]\s*0?\.?\d+%?)?\)/
const hslCallExpRegex = /hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*(,\s*0?\.\d+)?\)/
const hexRegex = /(^|\b)(#[0-9a-f]{3,9})(\b|$)/i

const discoverColorsInCSS = (
  syntaxTree: Tree,
  from: number,
  to: number,
  typeName: string,
  doc: Text,
): WidgetOptions | Array<WidgetOptions> | null => {
  switch (typeName) {
    case 'AttributeValue': {
      const innerTree = syntaxTree.resolveInner(from, 0).tree

      if (!innerTree) {
        return null
      }

      const overlayTree = innerTree.prop(NodeProp.mounted)?.tree

      if (overlayTree?.type.name !== 'Styles') {
        return null
      }

      const ret: Array<WidgetOptions> = []
      overlayTree.iterate({
        from: 0,
        to: overlayTree.length,
        enter: ({ type, from: overlayFrom, to: overlayTo }) => {
          const maybeWidgetOptions = discoverColorsInCSS(
            syntaxTree,
            // We add one because the tree does not include the
            // quotation mark from the style tag
            from + 1 + overlayFrom,
            from + 1 + overlayTo,
            type.name,
            doc,
          )

          if (maybeWidgetOptions) {
            if (Array.isArray(maybeWidgetOptions)) {
              throw new Error('Unexpected nested overlays')
            }

            ret.push(maybeWidgetOptions)
          }
        },
      })

      return ret
    }

    case 'CallExpression': {
      const callExp = doc.sliceString(from, to)
      const result = parseCallExpression(callExp)
      if (!result) {
        return null
      }
      return {
        ...result,
        from,
        to,
      }
    }

    case 'ColorLiteral': {
      const result = parseColorLiteral(doc.sliceString(from, to))
      if (!result) {
        return null
      }
      return {
        ...result,
        from,
        to,
      }
    }

    case 'ValueName': {
      const colorName = doc.sliceString(from, to)

      const result = parseNamedColor(colorName)

      if (!result) {
        return null
      }

      return {
        ...result,
        from,
        to,
      }
    }

    default:
      return null
  }
}

const parseCallExpression = (callExp: string): ColorData | null => {
  const fn = callExp.slice(0, 3)

  switch (fn) {
    case 'rgb': {
      const match = rgbCallExpRegex.exec(callExp)

      if (!match) {
        return null
      }

      const [, r = '', g = '', b = '', a] = match
      const color = rgbToHex(r, g, b)

      return {
        colorType: 'RGB',
        color,
        alpha: a || '',
      }
    }
    case 'hsl': {
      const match = hslCallExpRegex.exec(callExp)

      if (!match) {
        return null
      }

      const [, h = '', s = '', l = '', a] = match
      const color = hslToHex(h, s, l)

      return {
        colorType: 'HSL',
        color,
        alpha: a || '',
      }
    }
    default:
      return null
  }
}

const parseColorLiteral = (colorLiteral: string): ColorData | null => {
  const match = hexRegex.exec(colorLiteral)
  if (!match) {
    return null
  }
  const [color, alpha] = toFullHex(colorLiteral)

  return {
    colorType: 'HEX',
    color,
    alpha,
  }
}

const parseNamedColor = (colorName: string): ColorData | null => {
  const color = namedColors.get(colorName)

  if (!color) {
    return null
  }

  return {
    colorType: 'NAMED',
    color,
    alpha: '',
  }
}

const colorPickersDecorations = (view: EditorView): DecorationSet => {
  const widgets: Array<Range<Decoration>> = []

  const st = syntaxTree(view.state)

  for (const range of view.visibleRanges) {
    st.iterate({
      from: range.from,
      to: range.to,
      enter: ({ type, from, to }) => {
        const maybeWidgetOptions = discoverColorsInCSS(st, from, to, type.name, view.state.doc)

        if (!maybeWidgetOptions) {
          return
        }

        if (!Array.isArray(maybeWidgetOptions)) {
          widgets.push(
            Decoration.widget({
              widget: new ColorPickerWidget(maybeWidgetOptions),
              side: 1,
            }).range(maybeWidgetOptions.from),
          )

          return
        }

        for (const wo of maybeWidgetOptions) {
          widgets.push(
            Decoration.widget({
              widget: new ColorPickerWidget(wo),
              side: 1,
            }).range(wo.from),
          )
        }
      },
    })
  }

  return Decoration.set(widgets)
}

const toFullHex = (color: string): [string, string] => {
  if (color.length === 4) {
    // 3-char hex
    return [`#${color.charAt(1).repeat(2)}${color.charAt(2).repeat(2)}${color.charAt(3).repeat(2)}`, '']
  }

  if (color.length === 5) {
    // 4-char hex (alpha)
    return [
      `#${color.charAt(1).repeat(2)}${color.charAt(2).repeat(2)}${color.charAt(3).repeat(2)}`,
      color.charAt(4).repeat(2),
    ]
  }

  if (color.length === 9) {
    // 8-char hex (alpha)
    return [`#${color.slice(1, -2)}`, color.slice(-2)]
  }

  return [color, '']
}

const rgbComponentToHex = (component: string): string => {
  const numericValue = component.endsWith('%')
    ? Math.round((Number(component.slice(0, -1)) / 100) * 255.0)
    : Number(component)
  return decimalToHex(numericValue)
}

const decimalToHex = (decimal: number): string => {
  const hex = decimal.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}

const hexToRGBComponents = (hex: string): [number, number, number] => {
  const r = hex.slice(1, 3)
  const g = hex.slice(3, 5)
  const b = hex.slice(5, 7)
  return [Number.parseInt(r, 16), Number.parseInt(g, 16), Number.parseInt(b, 16)]
}

const rgbToHex = (r: string, g: string, b: string): string => {
  return `#${rgbComponentToHex(r)}${rgbComponentToHex(g)}${rgbComponentToHex(b)}`
}

const hslToHex = (h: string, s: string, l: string): string => {
  const sFloat = Number(s) / 100
  const lFloat = Number(l) / 100
  const [r, g, b] = hslToRGB(Number(h), sFloat, lFloat)
  return `#${decimalToHex(r)}${decimalToHex(g)}${decimalToHex(b)}`
}

// Preserve the upstream conversion formulas and rounding so existing edits keep the same values.
const hslToRGB = (hue: number, saturation: number, luminance: number): [number, number, number] => {
  if (saturation === 0) {
    const value = Math.round(luminance * 255)
    return [value, value, value]
  }

  const temp1 = luminance < 0.5 ? luminance * (1.0 + saturation) : luminance + saturation - luminance * saturation
  const temp2 = 2 * luminance - temp1

  const normalizedHue = hue / 360.0

  const tempR = clamp(normalizedHue + 0.333)
  const tempG = normalizedHue
  const tempB = clamp(normalizedHue - 0.333)

  const red = hueToRGB(temp1, temp2, tempR)
  const green = hueToRGB(temp1, temp2, tempG)
  const blue = hueToRGB(temp1, temp2, tempB)
  return [Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255)]
}

const clamp = (num: number): number => {
  if (num < 0) {
    return num + 1
  }
  if (num > 1) {
    return num - 1
  }
  return num
}

const hueToRGB = (temp1: number, temp2: number, tempHue: number): number => {
  if (6 * tempHue < 1) {
    return temp2 + (temp1 - temp2) * 6 * tempHue
  }
  if (2 * tempHue < 1) {
    return temp1
  }
  if (3 * tempHue < 2) {
    return temp2 + (temp1 - temp2) * (0.666 - tempHue) * 6
  }
  return temp2
}

const rgbToHSL = (r: number, g: number, b: number): [number, number, number] => {
  const redPercent = r / 255
  const greenPercent = g / 255
  const bluePercent = b / 255
  const min = Math.min(redPercent, greenPercent, bluePercent)
  const max = Math.max(redPercent, greenPercent, bluePercent)
  const luminance = (max + min) / 2

  if (max === min) {
    return [0, 0, luminance]
  }

  const saturation = luminance <= 0.5 ? (max - min) / (max + min) : (max - min) / (2.0 - max - min)

  let hue: number

  if (max === redPercent) {
    hue = (greenPercent - bluePercent) / (max - min)
  } else if (greenPercent === max) {
    hue = 2.0 + (bluePercent - redPercent) / (max - min)
  } else {
    hue = 4.0 + (redPercent - greenPercent) / (max - min)
  }
  hue = Math.round(hue * 60)

  while (hue < 0) {
    hue += 360
  }
  return [hue, saturation, luminance]
}

const wrapperClassName = 'cm-css-color-picker-wrapper'

class ColorPickerWidget extends WidgetType {
  private readonly state: PickerState
  private readonly color: string

  constructor({ color, ...state }: WidgetOptions) {
    super()
    this.state = state
    this.color = color
  }

  override eq(other: ColorPickerWidget): boolean {
    return (
      other.state.colorType === this.state.colorType &&
      other.color === this.color &&
      other.state.from === this.state.from &&
      other.state.to === this.state.to &&
      other.state.alpha === this.state.alpha
    )
  }

  toDOM(): HTMLSpanElement {
    const picker = document.createElement('input')
    pickerState.set(picker, this.state)
    picker.type = 'color'
    picker.value = this.color

    const wrapper = document.createElement('span')
    wrapper.appendChild(picker)
    wrapper.className = wrapperClassName

    return wrapper
  }

  override ignoreEvent(): boolean {
    return false
  }
}

const colorPickerTheme = EditorView.baseTheme({
  [`.${wrapperClassName}`]: {
    display: 'inline-block',
    outline: '1px solid #eee',
    marginRight: '0.6ch',
    height: '1em',
    width: '1em',
    transform: 'translateY(1px)',
  },
  [`.${wrapperClassName} input[type="color"]`]: {
    cursor: 'pointer',
    height: '100%',
    width: '100%',
    padding: 0,
    border: 'none',
    '&::-webkit-color-swatch-wrapper': {
      padding: 0,
    },
    '&::-webkit-color-swatch': {
      border: 'none',
    },
    '&::-moz-color-swatch': {
      border: 'none',
    },
  },
})

const colorPickerPlugin = ViewPlugin.fromClass(
  class ColorPickerViewPlugin {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = colorPickersDecorations(view)
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = colorPickersDecorations(update.view)
      }
    }
  },
  {
    decorations: (v) => v.decorations,
    eventHandlers: {
      change: (e, view) => {
        const target = e.target as HTMLInputElement
        if (
          target.nodeName !== 'INPUT' ||
          !target.parentElement ||
          !target.parentElement.classList.contains(wrapperClassName)
        ) {
          return false
        }

        const data = pickerState.get(target)!

        let converted = target.value + data.alpha
        if (data.colorType === 'RGB') {
          converted = `rgb(${hexToRGBComponents(target.value).join(', ')}${data.alpha})`
        } else if (data.colorType === 'NAMED') {
          // If the hex is an exact match for another named color, prefer retaining name
          for (const [key, value] of namedColors.entries()) {
            if (value === target.value) {
              converted = key
            }
          }
        } else if (data.colorType === 'HSL') {
          const [r, g, b] = hexToRGBComponents(target.value)
          const [h, s, l] = rgbToHSL(r, g, b)
          converted = `hsl(${h}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%${data.alpha})`
        }

        view.dispatch({
          changes: {
            from: data.from,
            to: data.to,
            insert: converted,
          },
        })

        return true
      },
    },
  },
)

/** Inline CSS color swatches with native color inputs, including CSS embedded in HTML. */
export const colorPicker: Extension = [colorPickerPlugin, colorPickerTheme]
