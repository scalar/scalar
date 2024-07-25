import { Command } from 'commander'

/**
 * Lint users scalar configs (scalar.config.json files)
 */
export function LintCommand() {
  const cmd = new Command('lint')

  return cmd
}
