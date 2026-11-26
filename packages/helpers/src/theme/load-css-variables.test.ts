import { presets } from '@scalar/themes'
import { describe, expect, it } from 'vitest'

import {
  getColorModesFromSelectors,
  loadCssVariables,
  parseVariableValue,
  resolveVariableValue,
  resolveVariables,
} from './load-css-variables'

/** Numbers 1 to 3 */
type OneToThree = 1 | 2 | 3

type colors = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow'

/**
 * CSS variable names that can be extracted from theme CSS
 */
type RequiredCssVar =
  | `--scalar-color-${OneToThree}`
  | `--scalar-background-${OneToThree}`
  | `--scalar-color-accent`
  | '--scalar-border-color'

type OptionalCssVars = `--scalar-color-${colors}`

type CssVariables = Record<RequiredCssVar, string> & Partial<Record<OptionalCssVars, string>>

type CssVariablesByMode = {
  light: CssVariables
  dark: CssVariables
}

type PresetId = keyof typeof presets
const presetList = Object.keys(presets) as PresetId[]

const expectedPresetVariables = {
  default: {
    light: {
      '--scalar-background-1': '#FFFFFF',
      '--scalar-background-2': '#F6F6F6',
      '--scalar-background-3': '#E7E7E7',
      '--scalar-border-color': '#DFDFDF',
      '--scalar-color-1': '#1B1B1B',
      '--scalar-color-2': '#707070',
      '--scalar-color-3': '#8E8E8E',
      '--scalar-color-accent': '#0099FF',
      '--scalar-color-blue': '#0072BD',
      '--scalar-color-green': '#069061',
      '--scalar-color-orange': '#FF5800',
      '--scalar-color-purple': '#5203D1',
      '--scalar-color-red': '#EF0006',
      '--scalar-color-yellow': '#EDBE20',
    },
    dark: {
      '--scalar-background-1': '#0F0F0F',
      '--scalar-background-2': '#1A1A1A',
      '--scalar-background-3': '#272727',
      '--scalar-border-color': '#2D2D2D',
      '--scalar-color-1': '#E7E7E7',
      '--scalar-color-2': '#A4A4A4',
      '--scalar-color-3': '#797979',
      '--scalar-color-accent': '#00AEFF',
      '--scalar-color-blue': '#4EB3EC',
      '--scalar-color-green': '#00B648',
      '--scalar-color-orange': '#FF8D4D',
      '--scalar-color-purple': '#B191F9',
      '--scalar-color-red': '#DC1B19',
      '--scalar-color-yellow': '#FFC90D',
    },
  },
  alternate: {
    light: {
      '--scalar-background-1': '#FAFAFA',
      '--scalar-background-2': '#F2F2F3',
      '--scalar-background-3': '#E7E7E8',
      '--scalar-border-color': '#E3E4E4',
      '--scalar-color-1': '#383A42',
      '--scalar-color-2': '#6C6E73',
      '--scalar-color-3': '#86878B',
      '--scalar-color-accent': '#465FEE',
      '--scalar-color-blue': '#3167E0',
      '--scalar-color-green': '#0C802E',
      '--scalar-color-orange': '#B0550D',
      '--scalar-color-purple': '#A626A4',
      '--scalar-color-red': '#C83C32',
      '--scalar-color-yellow': '#956506',
    },
    dark: {
      '--scalar-background-1': '#282C34',
      '--scalar-background-2': '#31353E',
      '--scalar-background-3': '#393D46',
      '--scalar-border-color': '#3C414A',
      '--scalar-color-1': '#BDC4D1',
      '--scalar-color-2': '#979DA8',
      '--scalar-color-3': '#7D838D',
      '--scalar-color-accent': '#92ADE0',
      '--scalar-color-blue': '#4AA5F0',
      '--scalar-color-green': '#8CC265',
      '--scalar-color-orange': '#D18F52',
      '--scalar-color-purple': '#D576F3',
      '--scalar-color-red': '#FD6F79',
      '--scalar-color-yellow': '#E6B965',
    },
  },
  moon: {
    light: {
      '--scalar-background-1': '#FDF6E3',
      '--scalar-background-2': '#F7F0DE',
      '--scalar-background-3': '#EDE8D8',
      '--scalar-border-color': '#EAE6D6',
      '--scalar-color-1': '#45525A',
      '--scalar-color-2': '#696F6F',
      '--scalar-color-3': '#848781',
      '--scalar-color-accent': '#5B7719',
      '--scalar-color-blue': '#0C75A4',
      '--scalar-color-green': '#667404',
      '--scalar-color-orange': '#AF5307',
      '--scalar-color-purple': '#B34192',
      '--scalar-color-red': '#D02C31',
      '--scalar-color-yellow': '#906601',
    },
    dark: {
      '--scalar-background-1': '#2D353B',
      '--scalar-background-2': '#393F43',
      '--scalar-background-3': '#424849',
      '--scalar-border-color': '#474C4C',
      '--scalar-color-1': '#DED1B5',
      '--scalar-color-2': '#AFA896',
      '--scalar-color-3': '#8F8D81',
      '--scalar-color-accent': '#C9D9B2',
      '--scalar-color-blue': '#7FBBB3',
      '--scalar-color-green': '#A7C080',
      '--scalar-color-orange': '#E69875',
      '--scalar-color-purple': '#D699B6',
      '--scalar-color-red': '#F48A8C',
      '--scalar-color-yellow': '#DBBC7F',
    },
  },
  purple: {
    light: {
      '--scalar-background-1': '#EFF1F5',
      '--scalar-background-2': '#E8EBEF',
      '--scalar-background-3': '#DFE1E7',
      '--scalar-border-color': '#DCDEE5',
      '--scalar-color-1': '#484B65',
      '--scalar-color-2': '#66697B',
      '--scalar-color-3': '#7E8190',
      '--scalar-color-accent': '#8839EF',
      '--scalar-color-blue': '#165FED',
      '--scalar-color-green': '#217B04',
      '--scalar-color-orange': '#B74606',
      '--scalar-color-purple': '#8839EF',
      '--scalar-color-red': '#D20F39',
      '--scalar-color-yellow': '#985D00',
    },
    dark: {
      '--scalar-background-1': '#1E1E2E',
      '--scalar-background-2': '#2A2B3C',
      '--scalar-background-3': '#343647',
      '--scalar-border-color': '#393B4D',
      '--scalar-color-1': '#CDD6F4',
      '--scalar-color-2': '#9AA1BB',
      '--scalar-color-3': '#757A91',
      '--scalar-color-accent': '#DFC9FA',
      '--scalar-color-blue': '#89B4FA',
      '--scalar-color-green': '#A6E3A1',
      '--scalar-color-orange': '#FAB387',
      '--scalar-color-purple': '#CBA6F7',
      '--scalar-color-red': '#F38BA8',
      '--scalar-color-yellow': '#F9E2AF',
    },
  },
  solarized: {
    light: {
      '--scalar-background-1': '#FDF6E3',
      '--scalar-background-2': '#F7F1DF',
      '--scalar-background-3': '#EEEADA',
      '--scalar-border-color': '#EBE8D8',
      '--scalar-color-1': '#3F545C',
      '--scalar-color-2': '#657070',
      '--scalar-color-3': '#818882',
      '--scalar-color-accent': '#8B6905',
      '--scalar-color-blue': '#0473B5',
      '--scalar-color-green': '#667505',
      '--scalar-color-orange': '#C34307',
      '--scalar-color-purple': '#6266B8',
      '--scalar-color-red': '#D42828',
      '--scalar-color-yellow': '#8B6905',
    },
    dark: {
      '--scalar-background-1': '#002B36',
      '--scalar-background-2': '#09323D',
      '--scalar-background-3': '#113842',
      '--scalar-border-color': '#143B45',
      '--scalar-color-1': '#ABBDBF',
      '--scalar-color-2': '#7F999D',
      '--scalar-color-3': '#608086',
      '--scalar-color-accent': '#EC6C6C',
      '--scalar-color-blue': '#3A9BE3',
      '--scalar-color-green': '#8A9E10',
      '--scalar-color-orange': '#F06D3E',
      '--scalar-color-purple': '#868DE3',
      '--scalar-color-red': '#FF5D53',
      '--scalar-color-yellow': '#BA8E10',
    },
  },
  bluePlanet: {
    light: {
      '--scalar-background-1': '#FFFFFF',
      '--scalar-background-2': '#F6F6F6',
      '--scalar-background-3': '#E9E9EA',
      '--scalar-border-color': '#E5E5E6',
      '--scalar-color-1': '#1F2328',
      '--scalar-color-2': '#63666A',
      '--scalar-color-3': '#888A8D',
      '--scalar-color-accent': '#0969DA',
      '--scalar-color-blue': '#0969DA',
      '--scalar-color-green': '#1A7F37',
      '--scalar-color-orange': '#BC4C00',
      '--scalar-color-purple': '#8250DF',
      '--scalar-color-red': '#CF222E',
      '--scalar-color-yellow': '#9A6700',
    },
    dark: {
      '--scalar-background-1': '#0D1117',
      '--scalar-background-2': '#1C2026',
      '--scalar-background-3': '#292D33',
      '--scalar-border-color': '#2F3339',
      '--scalar-color-1': '#E6EDF3',
      '--scalar-color-2': '#A7ADB3',
      '--scalar-color-3': '#797F85',
      '--scalar-color-accent': '#76A7F3',
      '--scalar-color-blue': '#58A6FF',
      '--scalar-color-green': '#3FB950',
      '--scalar-color-orange': '#DB6D28',
      '--scalar-color-purple': '#A371F7',
      '--scalar-color-red': '#F85149',
      '--scalar-color-yellow': '#D29922',
    },
  },
  deepSpace: {
    light: {
      '--scalar-background-1': '#FFFFFF',
      '--scalar-background-2': '#F7F7F7',
      '--scalar-background-3': '#E9E9E9',
      '--scalar-border-color': '#E5E5E5',
      '--scalar-color-1': '#171717',
      '--scalar-color-2': '#606060',
      '--scalar-color-3': '#8A8A8A',
      '--scalar-color-accent': '#0868F6',
      '--scalar-color-blue': '#0170D9',
      '--scalar-color-green': '#098330',
      '--scalar-color-orange': '#C24C0C',
      '--scalar-color-purple': '#8D49F1',
      '--scalar-color-red': '#E30F20',
      '--scalar-color-yellow': '#8F6C08',
    },
    dark: {
      '--scalar-background-1': '#000000',
      '--scalar-background-2': '#0E0E0E',
      '--scalar-background-3': '#1A1A1A',
      '--scalar-border-color': '#222222',
      '--scalar-color-1': '#EDEDED',
      '--scalar-color-2': '#A3A3A3',
      '--scalar-color-3': '#6F6F6F',
      '--scalar-color-accent': '#5BA2FE',
      '--scalar-color-blue': '#0285FF',
      '--scalar-color-green': '#00AD3A',
      '--scalar-color-orange': '#FB6A22',
      '--scalar-color-purple': '#9653FB',
      '--scalar-color-red': '#F13342',
      '--scalar-color-yellow': '#FFC300',
    },
  },
  saturn: {
    light: {
      '--scalar-background-1': '#FBF1C7',
      '--scalar-background-2': '#F3EAC1',
      '--scalar-background-3': '#E8DFB9',
      '--scalar-border-color': '#E5DBB6',
      '--scalar-color-1': '#3C3836',
      '--scalar-color-2': '#6F695B',
      '--scalar-color-3': '#88816C',
      '--scalar-color-accent': '#327376',
      '--scalar-color-blue': '#327376',
      '--scalar-color-green': '#6E6D08',
      '--scalar-color-orange': '#B14A01',
      '--scalar-color-purple': '#9D5074',
      '--scalar-color-red': '#CC241D',
      '--scalar-color-yellow': '#8C6107',
    },
    dark: {
      '--scalar-background-1': '#282828',
      '--scalar-background-2': '#363532',
      '--scalar-background-3': '#413F3A',
      '--scalar-border-color': '#46443E',
      '--scalar-color-1': '#EBDBB2',
      '--scalar-color-2': '#B2A78A',
      '--scalar-color-3': '#8A826E',
      '--scalar-color-accent': '#8EB5B6',
      '--scalar-color-blue': '#83A598',
      '--scalar-color-green': '#B8BB26',
      '--scalar-color-orange': '#FE8019',
      '--scalar-color-purple': '#D4879C',
      '--scalar-color-red': '#FE715C',
      '--scalar-color-yellow': '#FABD2F',
    },
  },
  kepler: {
    light: {
      '--scalar-background-1': '#FCFCFD',
      '--scalar-background-2': '#F3F3F4',
      '--scalar-background-3': '#E6E6E7',
      '--scalar-border-color': '#E2E2E3',
      '--scalar-color-1': '#1B1B1B',
      '--scalar-color-2': '#606060',
      '--scalar-color-3': '#878787',
      '--scalar-color-accent': '#5A65CD',
      '--scalar-color-blue': '#0C6ED2',
      '--scalar-color-green': '#2C7F2C',
      '--scalar-color-orange': '#BF4A06',
      '--scalar-color-purple': '#8A46EE',
      '--scalar-color-red': '#C54043',
      '--scalar-color-yellow': '#8C6A02',
    },
    dark: {
      '--scalar-background-1': '#0F0F11',
      '--scalar-background-2': '#1E1E20',
      '--scalar-background-3': '#2A2A2C',
      '--scalar-border-color': '#303032',
      '--scalar-color-1': '#E3E4E6',
      '--scalar-color-2': '#A6A6A8',
      '--scalar-color-3': '#79797B',
      '--scalar-color-accent': '#9EA4E0',
      '--scalar-color-blue': '#0285FF',
      '--scalar-color-green': '#69C967',
      '--scalar-color-orange': '#FB6A22',
      '--scalar-color-purple': '#9E65FE',
      '--scalar-color-red': '#FF7E78',
      '--scalar-color-yellow': '#FFC300',
    },
  },
  mars: {
    light: {
      '--scalar-background-1': '#F9F9F7',
      '--scalar-background-2': '#F1F1EF',
      '--scalar-background-3': '#E5E5E3',
      '--scalar-border-color': '#E1E1DF',
      '--scalar-color-1': '#2D2D2B',
      '--scalar-color-2': '#6B6B69',
      '--scalar-color-3': '#868684',
      '--scalar-color-accent': '#A4593B',
      '--scalar-color-blue': '#096DD1',
      '--scalar-color-green': '#0E7E34',
      '--scalar-color-orange': '#A05E0B',
      '--scalar-color-purple': '#8944EC',
      '--scalar-color-red': '#CD3506',
      '--scalar-color-yellow': '#8B6900',
    },
    dark: {
      '--scalar-background-1': '#2D2D2B',
      '--scalar-background-2': '#3B3B39',
      '--scalar-background-3': '#474745',
      '--scalar-border-color': '#4D4D4B',
      '--scalar-color-1': '#F9F9F7',
      '--scalar-color-2': '#BEBEBC',
      '--scalar-color-3': '#939391',
      '--scalar-color-accent': '#E0B09D',
      '--scalar-color-blue': '#60A7FF',
      '--scalar-color-green': '#00C853',
      '--scalar-color-orange': '#F59211',
      '--scalar-color-purple': '#B491FF',
      '--scalar-color-red': '#FD8163',
      '--scalar-color-yellow': '#FFC300',
    },
  },
  laserwave: {
    light: {
      '--scalar-background-1': '#FFFFFF',
      '--scalar-background-2': '#F4F2F7',
      '--scalar-background-3': '#CFC7DC',
      '--scalar-border-color': '#E4E0EB',
      '--scalar-color-1': '#322B3B',
      '--scalar-color-2': '#645676',
      '--scalar-color-3': '#9789A9',
      '--scalar-color-accent': '#40B4C4',
      '--scalar-color-blue': '#40B4C4',
      '--scalar-color-green': '#74DFC4',
      '--scalar-color-orange': '#FF52BF',
      '--scalar-color-purple': '#91889B',
      '--scalar-color-red': '#D887F5',
      '--scalar-color-yellow': '#FFE261',
    },
    dark: {
      '--scalar-background-1': '#27212E',
      '--scalar-background-2': '#322C39',
      '--scalar-background-3': '#4C4059',
      '--scalar-border-color': '#FFFFFF1A',
      '--scalar-color-1': '#FFFFFF',
      '--scalar-color-2': '#B8B6BA',
      '--scalar-color-3': '#706C74',
      '--scalar-color-accent': '#ED78C2',
      '--scalar-color-blue': '#40B4C4',
      '--scalar-color-green': '#74DFC4',
      '--scalar-color-orange': '#FF52BF',
      '--scalar-color-purple': '#91889B',
      '--scalar-color-red': '#D887F5',
      '--scalar-color-yellow': '#FFE261',
    },
  },
  halloween: {
    light: {
      '--scalar-background-1': '#FFFAF3',
      '--scalar-background-2': '#F7EFE3',
      '--scalar-background-3': '#ECDFCC',
      '--scalar-border-color': '#E9DCC8',
      '--scalar-color-1': '#2B2034',
      '--scalar-color-2': '#5E5068',
      '--scalar-color-3': '#8A7D93',
      '--scalar-color-accent': '#B04608',
      '--scalar-color-blue': '#3B4FB0',
      '--scalar-color-green': '#2C7034',
      '--scalar-color-orange': '#B04608',
      '--scalar-color-purple': '#7034B8',
      '--scalar-color-red': '#B81F3C',
      '--scalar-color-yellow': '#8A5D00',
    },
    dark: {
      '--scalar-background-1': '#15111D',
      '--scalar-background-2': '#1F1829',
      '--scalar-background-3': '#30263F',
      '--scalar-border-color': '#FFFFFF1A',
      '--scalar-color-1': '#F6F0FF',
      '--scalar-color-2': '#BCB1CC',
      '--scalar-color-3': '#857A96',
      '--scalar-color-accent': '#FF8A3D',
      '--scalar-color-blue': '#9FB4FF',
      '--scalar-color-green': '#A3E86B',
      '--scalar-color-orange': '#FF8A3D',
      '--scalar-color-purple': '#C79BFF',
      '--scalar-color-red': '#FF6B81',
      '--scalar-color-yellow': '#FFD166',
    },
  },
  elysiajs: {
    light: {
      '--scalar-background-1': '#FFFFFF',
      '--scalar-background-2': '#F6F6F6',
      '--scalar-background-3': '#E7E7E7',
      '--scalar-border-color': '#0000001A',
      '--scalar-color-1': '#1B1B1B',
      '--scalar-color-2': '#707070',
      '--scalar-color-3': '#8E8E8E',
      '--scalar-color-accent': '#F06292',
      '--scalar-color-blue': '#0072BD',
      '--scalar-color-green': '#069061',
      '--scalar-color-orange': '#FB892C',
      '--scalar-color-purple': '#5203D1',
      '--scalar-color-red': '#EF0006',
      '--scalar-color-yellow': '#EDBE20',
    },
    dark: {
      '--scalar-background-1': '#111728',
      '--scalar-background-2': '#1E293B',
      '--scalar-background-3': '#334155',
      '--scalar-border-color': '#FFFFFF1A',
      '--scalar-color-1': '#FFFFFFE6',
      '--scalar-color-2': '#9CA3AF',
      '--scalar-color-3': '#FFFFFF70',
      '--scalar-color-accent': '#F06292',
      '--scalar-color-blue': '#A5D6FF',
      '--scalar-color-green': '#A3FFA9',
      '--scalar-color-orange': '#E2AE83',
      '--scalar-color-purple': '#D2A8FF',
      '--scalar-color-red': '#FFA3A3',
      '--scalar-color-yellow': '#FFFCA3',
    },
  },
  fastify: {
    light: {
      '--scalar-background-1': '#FFFFFF',
      '--scalar-background-2': '#F5F5F5',
      '--scalar-background-3': '#EDEDED',
      '--scalar-border-color': '#0000001A',
      '--scalar-color-1': '#1C1E21',
      '--scalar-color-2': '#707070',
      '--scalar-color-3': '#8E8E8E',
      '--scalar-color-accent': '#2F8555',
      '--scalar-color-blue': '#33788F',
      '--scalar-color-green': '#007300',
      '--scalar-color-orange': '#FB892C',
      '--scalar-color-purple': '#5203D1',
      '--scalar-color-red': '#AF272B',
      '--scalar-color-yellow': '#B38200',
    },
    dark: {
      '--scalar-background-1': '#1B1B1D',
      '--scalar-background-2': '#242526',
      '--scalar-background-3': '#3B3B3B',
      '--scalar-border-color': '#FFFFFF1A',
      '--scalar-color-1': '#FFFFFFE6',
      '--scalar-color-2': '#FFFFFF9E',
      '--scalar-color-3': '#FFFFFF70',
      '--scalar-color-accent': '#27C2A0',
      '--scalar-color-blue': '#6ECFEF',
      '--scalar-color-green': '#26B226',
      '--scalar-color-orange': '#FF8D4D',
      '--scalar-color-purple': '#B191F9',
      '--scalar-color-red': '#FB565B',
      '--scalar-color-yellow': '#FFC426',
    },
  },
} as const satisfies Record<PresetId, CssVariablesByMode>

describe('getColorModesFromSelectors', () => {
  it('maps exact .light-mode and .dark-mode selectors', () => {
    expect(getColorModesFromSelectors('.light-mode, .dark-mode')).toEqual(['light', 'dark'])
  })

  it('returns empty when selectors are compound (not exactly .light-mode / .dark-mode)', () => {
    expect(getColorModesFromSelectors('.light-mode .scalar-card')).toEqual([])
    expect(getColorModesFromSelectors('.dark-mode .foo')).toEqual([])
  })

  it('returns only the modes that appear as whole selectors', () => {
    expect(getColorModesFromSelectors('.light-mode, .sidebar')).toEqual(['light'])
  })
})

describe('parseVariableValue', () => {
  it('normalizes 6- and 8-digit hex to uppercase', () => {
    expect(parseVariableValue('#aabbcc')).toBe('#AABBCC')
    expect(parseVariableValue('#aabbccdd')).toBe('#AABBCCDD')
  })

  it('expands 3-digit hex', () => {
    expect(parseVariableValue('#abc')).toBe('#AABBCC')
  })

  it('converts rgb and rgba to hex', () => {
    expect(parseVariableValue('rgb(0, 128, 255)')).toBe('#0080FF')
    expect(parseVariableValue('rgba(255, 0, 0, 0.5)')).toBe('#FF000080')
    expect(parseVariableValue('rgba(255, 0, 0, 1)')).toBe('#FF0000')
  })

  it('returns var() strings for later resolution', () => {
    expect(parseVariableValue('var(--scalar-color-1)')).toBe('var(--scalar-color-1)')
    expect(parseVariableValue('var(--scalar-color-1, #fff)')).toBe('var(--scalar-color-1, #fff)')
  })

  it('returns undefined for unsupported values', () => {
    expect(parseVariableValue('hsl(0 0% 50%)')).toBeUndefined()
    expect(parseVariableValue('not a color')).toBeUndefined()
  })
})

describe('resolveVariableValue', () => {
  it('follows a chain of var references', () => {
    const vars = {
      '--a': 'var(--b)',
      '--b': '#112233',
    }
    expect(resolveVariableValue('var(--a)', vars)).toBe('#112233')
  })

  it('returns the original value when the name is missing', () => {
    expect(resolveVariableValue('var(--missing)', {})).toBe('var(--missing)')
  })

  it('returns non-var values unchanged', () => {
    expect(resolveVariableValue('#abc', { '--x': '#fff' })).toBe('#abc')
  })
})

describe('resolveVariables', () => {
  it('resolves var() values using the same map', () => {
    const input = {
      '--scalar-color-1': 'var(--scalar-background-1)',
      '--scalar-background-1': '#FFFFFF',
    }
    expect(resolveVariables(input)).toEqual({
      '--scalar-color-1': '#FFFFFF',
      '--scalar-background-1': '#FFFFFF',
    })
  })

  it('leaves unresolved var() as-is', () => {
    const input = { '--x': 'var(--y)' }
    expect(resolveVariables(input)).toEqual(input)
  })
})

describe('load-css-variables', () => {
  it.each(presetList)('parses the %s preset correctly', async (id) => {
    const parsed = await loadCssVariables(presets[id].theme)
    const expected = expectedPresetVariables[id]

    expect(parsed).toMatchObject(expected)
  })
})

/**
 * WCAG 2.x relative luminance and contrast ratio for sRGB hex colors.
 *
 * Kept local to the test: the palette guards below only need the formula, and
 * a dependency on a color library would make the test pass or fail on a bump
 * rather than on a change to the preset.
 */
const linearChannel = (channel: number): number =>
  channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

const hexToRgb = (hex: string): [number, number, number] => {
  const value = hex.replace('#', '')
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255) as [
    number,
    number,
    number,
  ]
}

const luminance = ([r, g, b]: [number, number, number]): number =>
  0.2126 * linearChannel(r) + 0.7152 * linearChannel(g) + 0.0722 * linearChannel(b)

const contrastRatio = (foreground: string, background: string): number => {
  const [hi, lo] = [luminance(hexToRgb(foreground)), luminance(hexToRgb(background))].sort((a, b) => b - a)
  return (hi! + 0.05) / (lo! + 0.05)
}

/**
 * Projects a `color(display-p3 r g b)` value onto an sRGB display by converting
 * through XYZ and clipping each channel, which is what a browser does on a
 * monitor without a wide gamut. A Colour Contrast Analyser on such a monitor
 * samples this clipped color, so it is the value the palette has to satisfy.
 */
const displayP3ToClippedSrgb = ([r, g, b]: [number, number, number]): string => {
  const [lr, lg, lb] = [linearChannel(r), linearChannel(g), linearChannel(b)]
  const x = 0.4865709 * lr + 0.2656677 * lg + 0.1982173 * lb
  const y = 0.2289746 * lr + 0.6917385 * lg + 0.0792869 * lb
  const z = 0.0451134 * lg + 1.0439444 * lb
  const linearSrgb = [
    3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
    -0.969266 * x + 1.8760108 * y + 0.041556 * z,
    0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
  ]
  return linearSrgb
    .map((channel) => Math.min(1, Math.max(0, channel)))
    .map((channel) => (channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055))
    .map((channel) =>
      Math.round(channel * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
}

describe('default preset contrast', () => {
  /** Small text needs 4.5:1 under WCAG 1.4.3, and the blue is used for 13px labels and code strings. */
  const MINIMUM_TEXT_CONTRAST = 4.5

  it.each(['light', 'dark'] as const)('keeps --scalar-color-blue legible as text in %s mode', async (mode) => {
    const variables = (await loadCssVariables(presets.default.theme))[mode]
    const blue = variables['--scalar-color-blue']!

    expect(contrastRatio(blue, variables['--scalar-background-1']!)).toBeGreaterThanOrEqual(MINIMUM_TEXT_CONTRAST)
    expect(contrastRatio(blue, variables['--scalar-background-2']!)).toBeGreaterThanOrEqual(MINIMUM_TEXT_CONTRAST)
  })

  it('keeps the wide-gamut light blue in step with its hex value and legible once clipped to sRGB', async () => {
    const variables = (await loadCssVariables(presets.default.theme)).light
    const blue = variables['--scalar-color-blue']!

    // The @supports block re-declares the light palette in display-p3, and that
    // is the value every current browser paints, so it must track the hex.
    const supportsBlock = presets.default.theme.match(/@supports[^{]*\{[\s\S]*?\.light-mode\s*\{([\s\S]*?)\}/)?.[1]
    const p3 = supportsBlock?.match(/--scalar-color-blue:\s*color\(display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
    expect(p3).not.toBeNull()

    const coordinates = p3!.slice(1, 4).map(Number) as [number, number, number]
    hexToRgb(blue).forEach((channel, index) => {
      expect(Math.abs(coordinates[index]! - channel)).toBeLessThan(1 / 255)
    })

    const clipped = displayP3ToClippedSrgb(coordinates)
    expect(contrastRatio(clipped, variables['--scalar-background-2']!)).toBeGreaterThanOrEqual(MINIMUM_TEXT_CONTRAST)
  })
})
