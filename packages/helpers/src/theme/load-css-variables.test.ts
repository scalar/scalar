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
      '--scalar-color-2': '#757575',
      '--scalar-color-3': '#8E8E8E',
      '--scalar-color-accent': '#0099FF',
      '--scalar-color-blue': '#0082D0',
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
      '--scalar-background-1': '#F9F9F9',
      '--scalar-background-2': '#F1F1F1',
      '--scalar-background-3': '#E7E7E7',
      '--scalar-border-color': '#0000001A',
      '--scalar-color-1': '#1B1B1B',
      '--scalar-color-2': '#757575',
      '--scalar-color-3': '#8E8E8E',
      '--scalar-color-accent': '#1B1B1B',
      '--scalar-color-blue': '#0082D0',
      '--scalar-color-green': '#069061',
      '--scalar-color-orange': '#FB892C',
      '--scalar-color-purple': '#5203D1',
      '--scalar-color-red': '#EF0006',
      '--scalar-color-yellow': '#EDBE20',
    },
    dark: {
      '--scalar-background-1': '#131313',
      '--scalar-background-2': '#1D1D1D',
      '--scalar-background-3': '#272727',
      '--scalar-border-color': '#2A2B2A',
      '--scalar-color-1': '#FFFFFFE6',
      '--scalar-color-2': '#FFFFFF9E',
      '--scalar-color-3': '#FFFFFF70',
      '--scalar-color-accent': '#FFFFFFE6',
      '--scalar-color-blue': '#4EB3EC',
      '--scalar-color-green': '#00B648',
      '--scalar-color-orange': '#FF8D4D',
      '--scalar-color-purple': '#B191F9',
      '--scalar-color-red': '#DD2F2C',
      '--scalar-color-yellow': '#FFC90D',
    },
  },
  moon: {
    light: {
      '--scalar-background-1': '#CCC9B3',
      '--scalar-background-2': '#C2BFAA',
      '--scalar-background-3': '#B8B5A1',
      '--scalar-border-color': '#00000033',
      '--scalar-color-1': '#000000',
      '--scalar-color-2': '#000000',
      '--scalar-color-3': '#000000',
      '--scalar-color-accent': '#645B0F',
      '--scalar-color-blue': '#1D4ED8',
      '--scalar-color-green': '#047857',
      '--scalar-color-orange': '#C2410C',
      '--scalar-color-purple': '#6D28D9',
      '--scalar-color-red': '#B91C1C',
    },
    dark: {
      '--scalar-background-1': '#313332',
      '--scalar-background-2': '#393B3A',
      '--scalar-background-3': '#414342',
      '--scalar-border-color': '#505452',
      '--scalar-color-1': '#FFFEF3',
      '--scalar-color-2': '#FFFEF3',
      '--scalar-color-3': '#FFFEF3',
      '--scalar-color-accent': '#C3B531',
      '--scalar-color-blue': '#4EB3EC',
      '--scalar-color-green': '#00B648',
      '--scalar-color-orange': '#FF8D4D',
      '--scalar-color-purple': '#B191F9',
      '--scalar-color-red': '#DC1B19',
      '--scalar-color-yellow': '#FFC90D',
    },
  },
  purple: {
    light: {
      '--scalar-background-1': '#FFFFFF',
      '--scalar-background-2': '#F5F6F8',
      '--scalar-background-3': '#ECEEF1',
      '--scalar-border-color': '#D7D7CEAD',
      '--scalar-color-1': '#1B1B1B',
      '--scalar-color-2': '#757575',
      '--scalar-color-3': '#8E8E8E',
      '--scalar-color-accent': '#5469D4',
      '--scalar-color-blue': '#1763A6',
      '--scalar-color-green': '#17803D',
      '--scalar-color-orange': '#E25B09',
      '--scalar-color-purple': '#5C3993',
      '--scalar-color-red': '#E10909',
      '--scalar-color-yellow': '#EDBE20',
    },
    dark: {
      '--scalar-background-1': '#15171C',
      '--scalar-background-2': '#1C1E24',
      '--scalar-background-3': '#22252B',
      '--scalar-border-color': '#3F4145',
      '--scalar-color-1': '#FAFAFA',
      '--scalar-color-2': '#C9CED8',
      '--scalar-color-3': '#8C99AD',
      '--scalar-color-accent': '#5469D4',
      '--scalar-color-blue': '#2B7ABF',
      '--scalar-color-green': '#30A159',
      '--scalar-color-orange': '#F07528',
      '--scalar-color-purple': '#7A59B1',
      '--scalar-color-red': '#DC1B19',
      '--scalar-color-yellow': '#EEC644',
    },
  },
  solarized: {
    light: {
      '--scalar-background-1': '#FDF6E3',
      '--scalar-background-2': '#EEE8D5',
      '--scalar-background-3': '#DDD6C1',
      '--scalar-border-color': '#DED8C8',
      '--scalar-color-1': '#584C27',
      '--scalar-color-2': '#616161',
      '--scalar-color-3': '#A89F84',
      '--scalar-color-accent': '#B58900',
      '--scalar-color-blue': '#1D4ED8',
      '--scalar-color-green': '#047857',
      '--scalar-color-orange': '#C2410C',
      '--scalar-color-purple': '#6D28D9',
      '--scalar-color-red': '#B91C1C',
    },
    dark: {
      '--scalar-background-1': '#00212B',
      '--scalar-background-2': '#012B36',
      '--scalar-background-3': '#004052',
      '--scalar-border-color': '#2F4851',
      '--scalar-color-1': '#FFFFFF',
      '--scalar-color-2': '#CCCCCC',
      '--scalar-color-3': '#6D8890',
      '--scalar-color-accent': '#007ACC',
      '--scalar-color-blue': '#4EB3EC',
      '--scalar-color-green': '#00B648',
      '--scalar-color-orange': '#FF8D4D',
      '--scalar-color-purple': '#B191F9',
      '--scalar-color-red': '#DC1B19',
      '--scalar-color-yellow': '#FFC90D',
    },
  },
  bluePlanet: {
    light: {
      '--scalar-background-1': '#F0F2F5',
      '--scalar-background-2': '#EAECF0',
      '--scalar-background-3': '#E0E2E6',
      '--scalar-border-color': '#D5D5D5',
      '--scalar-color-1': '#09090B',
      '--scalar-color-2': '#71717A',
      '--scalar-color-3': '#19191C80',
      '--scalar-color-accent': '#09090B',
      '--scalar-color-blue': '#0082D0',
      '--scalar-color-green': '#069061',
      '--scalar-color-orange': '#FB892C',
      '--scalar-color-purple': '#5203D1',
      '--scalar-color-red': '#EF0006',
      '--scalar-color-yellow': '#EDBE20',
    },
    dark: {
      '--scalar-background-1': '#000E23',
      '--scalar-background-2': '#01132E',
      '--scalar-background-3': '#03193B',
      '--scalar-border-color': '#2E394C',
      '--scalar-color-1': '#FAFAFA',
      '--scalar-color-2': '#A1A1AA',
      '--scalar-color-3': '#FFFFFF88',
      '--scalar-color-accent': '#FAFAFA',
      '--scalar-color-blue': '#6BC1FE',
      '--scalar-color-orange': '#F98943',
      '--scalar-color-purple': '#B191F9',
      '--scalar-color-red': '#FF8589',
      '--scalar-color-yellow': '#FFCC4D',
    },
  },
  deepSpace: {
    light: {
      '--scalar-background-1': '#FFFFFF',
      '--scalar-background-2': '#F4F4F5',
      '--scalar-background-3': '#E3E3E6',
      '--scalar-border-color': '#E4E4E7',
      '--scalar-color-1': '#09090B',
      '--scalar-color-2': '#71717A',
      '--scalar-color-3': '#19191C80',
      '--scalar-color-accent': '#09090B',
      '--scalar-color-blue': '#0082D0',
      '--scalar-color-green': '#069061',
      '--scalar-color-orange': '#FB892C',
      '--scalar-color-purple': '#5203D1',
      '--scalar-color-red': '#EF0006',
      '--scalar-color-yellow': '#EDBE20',
    },
    dark: {
      '--scalar-background-1': '#09090B',
      '--scalar-background-2': '#18181B',
      '--scalar-background-3': '#2C2C30',
      '--scalar-border-color': '#FFFFFF29',
      '--scalar-color-1': '#FAFAFA',
      '--scalar-color-2': '#A1A1AA',
      '--scalar-color-3': '#FFFFFF88',
      '--scalar-color-accent': '#FAFAFA',
      '--scalar-color-blue': '#6BC1FE',
      '--scalar-color-orange': '#F98943',
      '--scalar-color-purple': '#B191F9',
      '--scalar-color-red': '#FF8589',
      '--scalar-color-yellow': '#FFCC4D',
    },
  },
  saturn: {
    light: {
      '--scalar-background-1': '#F3F3EE',
      '--scalar-background-2': '#E8E8E3',
      '--scalar-background-3': '#E4E4DF',
      '--scalar-border-color': '#D7D7CED9',
      '--scalar-color-1': '#1B1B1B',
      '--scalar-color-2': '#757575',
      '--scalar-color-3': '#8E8E8E',
      '--scalar-color-accent': '#1763A6',
      '--scalar-color-blue': '#1763A6',
      '--scalar-color-green': '#17803D',
      '--scalar-color-orange': '#E25B09',
      '--scalar-color-purple': '#5C3993',
      '--scalar-color-red': '#E10909',
      '--scalar-color-yellow': '#EDBE20',
    },
    dark: {
      '--scalar-background-1': '#09090B',
      '--scalar-background-2': '#18181B',
      '--scalar-background-3': '#2C2C30',
      '--scalar-border-color': '#FFFFFF2B',
      '--scalar-color-1': '#FAFAFA',
      '--scalar-color-2': '#A1A1AA',
      '--scalar-color-3': '#FFFFFF88',
      '--scalar-color-accent': '#4EB3EC',
      '--scalar-color-blue': '#2B7ABF',
      '--scalar-color-green': '#30A159',
      '--scalar-color-orange': '#F07528',
      '--scalar-color-purple': '#7A59B1',
      '--scalar-color-red': '#DC1B19',
      '--scalar-color-yellow': '#EEC644',
    },
  },
  kepler: {
    light: {
      '--scalar-background-1': '#FFFFFF',
      '--scalar-background-2': '#F6F6F6',
      '--scalar-background-3': '#E7E7E7',
      '--scalar-border-color': '#0000001A',
      '--scalar-color-1': '#1B1B1B',
      '--scalar-color-2': '#757575',
      '--scalar-color-3': '#8E8E8E',
      '--scalar-color-accent': '#7070FF',
      '--scalar-color-blue': '#0082D0',
      '--scalar-color-green': '#069061',
      '--scalar-color-orange': '#FB892C',
      '--scalar-color-purple': '#5203D1',
      '--scalar-color-red': '#EF0006',
      '--scalar-color-yellow': '#EDBE20',
    },
    dark: {
      '--scalar-background-1': '#000212',
      '--scalar-background-2': '#0D0F1E',
      '--scalar-background-3': '#232533',
      '--scalar-border-color': '#313245',
      '--scalar-color-1': '#F7F8F8',
      '--scalar-color-2': '#B4BCD0',
      '--scalar-color-3': '#B4BCD099',
      '--scalar-color-accent': '#828FFF',
      '--scalar-color-blue': '#4EB3EC',
      '--scalar-color-green': '#00B648',
      '--scalar-color-orange': '#FF8D4D',
      '--scalar-color-purple': '#B191F9',
      '--scalar-color-red': '#DC1B19',
      '--scalar-color-yellow': '#FFC90D',
    },
  },
  mars: {
    light: {
      '--scalar-background-1': '#F9F6F0',
      '--scalar-background-2': '#F2EFE8',
      '--scalar-background-3': '#E9E7E2',
      '--scalar-border-color': '#CBA59C99',
      '--scalar-color-1': '#C75549',
      '--scalar-color-2': '#C75549',
      '--scalar-color-3': '#C75549',
      '--scalar-color-accent': '#C75549',
      '--scalar-color-blue': '#19689A',
      '--scalar-color-green': '#09533A',
      '--scalar-color-orange': '#B26C34',
      '--scalar-color-purple': '#4C2191',
      '--scalar-color-red': '#AA181D',
      '--scalar-color-yellow': '#AB8D2B',
    },
    dark: {
      '--scalar-background-1': '#140507',
      '--scalar-background-2': '#20090C',
      '--scalar-background-3': '#321116',
      '--scalar-border-color': '#3C3031',
      '--scalar-color-1': '#FFFFFFE6',
      '--scalar-color-2': '#FFFFFF9E',
      '--scalar-color-3': '#FFFFFF70',
      '--scalar-color-accent': '#FFFFFFE6',
      '--scalar-color-blue': '#6BC1FE',
      '--scalar-color-orange': '#F98943',
      '--scalar-color-purple': '#B191F9',
      '--scalar-color-red': '#FF8589',
      '--scalar-color-yellow': '#FFCC4D',
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
  elysiajs: {
    light: {
      '--scalar-background-1': '#FFFFFF',
      '--scalar-background-2': '#F6F6F6',
      '--scalar-background-3': '#E7E7E7',
      '--scalar-border-color': '#0000001A',
      '--scalar-color-1': '#1B1B1B',
      '--scalar-color-2': '#757575',
      '--scalar-color-3': '#8E8E8E',
      '--scalar-color-accent': '#F06292',
      '--scalar-color-blue': '#0082D0',
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
      '--scalar-color-2': '#757575',
      '--scalar-color-3': '#8E8E8E',
      '--scalar-color-accent': '#2F8555',
      '--scalar-color-blue': '#3B8BA5',
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
