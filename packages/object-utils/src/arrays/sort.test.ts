import { sortByOrder } from '../arrays/sort'
import { describe, expect, it } from 'vitest'

describe('Sort arrays by an order list', () => {
  it('Sorts basic by list', () => {
    const list = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }]

    expect(sortByOrder(list, ['5', '1', '3', '4', '2'], 'id')).toEqual([
      { id: '5' },
      { id: '1' },
      { id: '3' },
      { id: '4' },
      { id: '2' },
    ])
  })

  it('Handles items without an id in the order list', () => {
    const list = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }]

    expect(sortByOrder(list, ['5', '3', '4'], 'id')).toEqual([
      { id: '5' },
      { id: '3' },
      { id: '4' },
      { id: '1' },
      { id: '2' },
    ])
  })
})
