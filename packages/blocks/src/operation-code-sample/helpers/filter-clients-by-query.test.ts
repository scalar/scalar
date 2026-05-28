import { describe, expect, it } from 'vitest'

import type { ClientOption, ClientOptionGroup, CustomClientOptionGroup } from '../types'
import { filterClientsByQuery } from './filter-clients-by-query'

describe('filterClientsByQuery', () => {
  const jsFetch: ClientOption = {
    id: 'js/fetch',
    label: 'Fetch API',
    lang: 'js',
    title: 'Fetch API',
    targetKey: 'js',
    targetTitle: 'JavaScript',
    clientKey: 'fetch',
  }
  const jsAxios: ClientOption = {
    id: 'js/axios',
    label: 'Axios',
    lang: 'js',
    title: 'Axios',
    targetKey: 'js',
    targetTitle: 'JavaScript',
    clientKey: 'axios',
  }
  const pythonRequests: ClientOption = {
    id: 'python/requests',
    label: 'Requests',
    lang: 'python',
    title: 'Requests',
    targetKey: 'python',
    targetTitle: 'Python',
    clientKey: 'requests',
  }
  const shellCurl: ClientOption = {
    id: 'shell/curl',
    label: 'cURL',
    lang: 'curl',
    title: 'cURL',
    targetKey: 'shell',
    targetTitle: 'Shell',
    clientKey: 'curl',
  }

  const twoVisibleGroups: ClientOptionGroup[] = [
    { label: 'JavaScript', key: 'js', options: [jsFetch, jsAxios] },
    { label: 'Python', key: 'python', options: [pythonRequests] },
  ]

  const flatOptions = twoVisibleGroups.flatMap((g) => g.options)

  it('returns the same options reference when the query is empty', () => {
    const result = filterClientsByQuery('', flatOptions, twoVisibleGroups)
    expect(result).toBe(flatOptions)
  })

  it('matches option labels case-insensitively in the flat path', () => {
    const singleGroup: ClientOptionGroup[] = [{ label: 'JavaScript', key: 'js', options: [jsFetch, jsAxios] }]
    const options = singleGroup.flatMap((g) => g.options)
    expect(filterClientsByQuery('AXIOS', options, singleGroup)).toEqual([jsAxios])
    expect(filterClientsByQuery('fetch api', options, singleGroup)).toEqual([jsFetch])
  })

  it('matches clientKey and lang in the flat path', () => {
    const singleGroup: ClientOptionGroup[] = [{ label: 'JavaScript', key: 'js', options: [jsFetch, jsAxios] }]
    const options = singleGroup.flatMap((g) => g.options)
    expect(filterClientsByQuery('fetch', options, singleGroup)).toEqual([jsFetch])
    expect(filterClientsByQuery('js', options, singleGroup)).toEqual([jsFetch, jsAxios])
  })

  it('uses an empty groups array like a single-group flat filter', () => {
    expect(filterClientsByQuery('python', flatOptions, [])).toEqual([pythonRequests])
  })

  describe('when more than one visible group exists', () => {
    it('includes every option in a group when the group label matches', () => {
      expect(filterClientsByQuery('javascript', flatOptions, twoVisibleGroups)).toEqual([jsFetch, jsAxios])
    })

    it('includes every option in a group when the group key matches', () => {
      expect(filterClientsByQuery('python', flatOptions, twoVisibleGroups)).toEqual([pythonRequests])
    })

    it('filters options per group when neither the group nor its key matches the query', () => {
      expect(filterClientsByQuery('axios', flatOptions, twoVisibleGroups)).toEqual([jsAxios])
    })

    it('accumulates matches from multiple groups', () => {
      const groups: ClientOptionGroup[] = [
        { label: 'JavaScript', key: 'js', options: [jsFetch] },
        { label: 'Shell', key: 'shell', options: [shellCurl] },
      ]
      const options = groups.flatMap((g) => g.options)
      expect(filterClientsByQuery('curl', options, groups)).toEqual([shellCurl])
    })
  })

  it('treats only one visible group when other groups lack a label or options', () => {
    const groups: CustomClientOptionGroup[] = [
      { label: 'JavaScript', key: 'js', options: [jsFetch, jsAxios] },
      { label: '', key: 'python', options: [pythonRequests] },
      { label: 'Empty', key: 'shell', options: [] },
    ]
    const options = groups.flatMap((g) => g.options)
    // visibleGroupCount is 1 — multi-group branch is skipped
    expect(filterClientsByQuery('python', options, groups)).toEqual([pythonRequests])
  })

  it('returns no options when nothing matches', () => {
    expect(filterClientsByQuery('rust', flatOptions, twoVisibleGroups)).toEqual([])
  })
})
