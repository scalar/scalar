export interface GitHubInfo {
  user: string | null
  pull: number | null
  links: {
    commit: string
    pull: string | null
    user: string | null
  }
}
