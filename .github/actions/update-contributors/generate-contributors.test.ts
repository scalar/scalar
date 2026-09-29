import { describe, expect, it } from 'vitest'

import { generateContributors } from './generate-contributors'

const start = '<!-- readme: collaborators,contributors -start -->'
const end = '<!-- readme: collaborators,contributors -end -->'
const readme = `Introduction\n${start}\nOld table\n${end}\nFooter`
const user = (
  login: string,
  avatar_url = 'https://avatars.githubusercontent.com/u/123?v=4',
  type = 'User',
): { login: string; avatar_url: string; type: string } => ({
  login,
  avatar_url,
  type,
})

describe('generate-contributors', () => {
  it.each([
    ['https://avatars.githubusercontent.com/u/123', 'https://avatars.githubusercontent.com/u/123?s=200'],
    ['https://avatars.githubusercontent.com/u/123?v=4', 'https://avatars.githubusercontent.com/u/123?v=4&amp;s=200'],
    [
      'https://avatars.githubusercontent.com/u/123?v=4&s=40&s=80',
      'https://avatars.githubusercontent.com/u/123?v=4&amp;s=200',
    ],
  ])('requests 200-pixel avatars for %s', (source, expected) => {
    const result = generateContributors(readme, [], [user('alice', source)])
    expect(result.match(/<img src="([^"]+)"/)?.[1]).toBe(expected)
    expect(result.match(/width="([^"]+)"/)?.[1]).toBe('100;')
  })

  it('keeps collaborators first, removes duplicates, and excludes bots', () => {
    const result = generateContributors(
      readme,
      [user('alice'), user('alice')],
      [user('bob'), user('alice'), user('robot', undefined, 'Bot'), user('actions-user-test')],
    )
    expect([...result.matchAll(/alt="([^"]+)"/g)].map((match) => match[1])).toStrictEqual(['alice', 'bob'])
    expect([...result.matchAll(/href="([^"]+)"/g)].map((match) => match[1])).toStrictEqual([
      'https://github.com/alice',
      'https://github.com/bob',
    ])
  })

  it('wraps the seventh contributor onto a second row', () => {
    const result = generateContributors(
      readme,
      [],
      Array.from({ length: 7 }, (_, index) => user(`user${index}`)),
    )
    const rows = [...result.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
    expect(rows.map((row) => [...(row[1] ?? '').matchAll(/<td /g)].length)).toStrictEqual([6, 1])
    expect(result.includes('</tbody>\n</table>')).toBe(true)
  })

  it('preserves surrounding content and is stable when regenerated', () => {
    const users = [user('alice')]
    const result = generateContributors(readme, [], users)
    expect(result.slice(0, result.indexOf(start))).toBe('Introduction\n')
    expect(result.slice(result.indexOf(end) + end.length)).toBe('\nFooter')
    expect(generateContributors(result, [], users)).toBe(result)
  })

  it.each(['No markers', `${end}\n${start}`, start])('rejects missing or reversed markers in %s', (content) => {
    expect(() => generateContributors(content, [], [user('alice')])).toThrow(
      'Missing contributor markers or an empty contributor list',
    )
  })

  it('rejects an empty contributor list instead of erasing the table', () => {
    expect(() => generateContributors(readme, [], [])).toThrow(
      'Missing contributor markers or an empty contributor list',
    )
  })
})
