import { readFile, writeFile } from 'node:fs/promises'

import { type Contributor, generateContributors } from './generate-contributors.ts'

type Repository = { owner: string; repo: string }

/** The pagination API supplied by actions/github-script. */
type GitHubClient = {
  paginate: (
    route: 'GET /repos/{owner}/{repo}/collaborators' | 'GET /repos/{owner}/{repo}/contributors',
    parameters: Repository & { per_page: number; affiliation?: 'direct' },
  ) => Promise<Contributor[]>
}

/** Fetch contributors and update the checked-out repository's README. */
export const updateContributors = async (github: GitHubClient, repository: Repository): Promise<void> => {
  const [collaborators, contributors] = await Promise.all([
    github.paginate('GET /repos/{owner}/{repo}/collaborators', {
      ...repository,
      affiliation: 'direct',
      per_page: 100,
    }),
    github.paginate('GET /repos/{owner}/{repo}/contributors', {
      ...repository,
      per_page: 100,
    }),
  ])
  const readme = await readFile('README.md', 'utf8')
  await writeFile('README.md', generateContributors(readme, collaborators, contributors))
}
