import type { PostResponseScript, PostResponseScripts } from '@scalar/oas-utils/entities/spec'

export type { PostResponseScript }
export type PostResponseScriptsProps = {
  scripts: PostResponseScripts | undefined
  onUpdate: (scripts: PostResponseScripts | undefined) => void
}
