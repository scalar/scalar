/** GitHub fields needed to render the README contributor table. */
export type Contributor = {
  login: string
  avatar_url: string
  type: string
}

/** Replace the contributor table without changing other README sections. */
export const generateContributors = (
  readme: string,
  collaborators: Contributor[],
  contributors: Contributor[],
): string => {
  const seen = new Set<string>()
  const users = [...collaborators, ...contributors].filter(({ login, type }) => {
    if (type === 'Bot' || login.includes('actions-user') || seen.has(login)) {
      return false
    }
    seen.add(login)
    return true
  })
  const rows: string[] = []
  for (let index = 0; index < users.length; index += 6) {
    const cells = users.slice(index, index + 6).map(({ login, avatar_url }) => {
      const avatar = new URL(avatar_url)
      // Request twice the display width for sharp images on high-density screens.
      avatar.searchParams.set('s', '200')
      return `
            <td align="center">
                <a href="https://github.com/${login}">
                    <img src="${avatar.href.replaceAll('&', '&amp;')}" width="100;" alt="${login}"/>
                    <br />
                    <sub><b>${login}</b></sub>
                </a>
            </td>`
    })
    rows.push('\t\t<tr>' + cells.join('') + '\n\t\t</tr>\n')
  }
  const start = '<!-- readme: collaborators,contributors -start -->'
  const end = '<!-- readme: collaborators,contributors -end -->'
  const startIndex = readme.indexOf(start)
  const endIndex = readme.indexOf(end)
  if (startIndex === -1 || endIndex < startIndex || users.length === 0) {
    throw new Error('Missing contributor markers or an empty contributor list')
  }
  const table = start + '\n<table>\n\t<tbody>\n' + rows.join('') + '\t</tbody>\n</table>\n' + end
  return readme.slice(0, startIndex) + table + readme.slice(endIndex + end.length)
}
