import { execSync } from 'node:child_process'

/**
 * Execute a command with proper error handling
 * @param command The command to execute
 * @param errorMessage Optional custom error message
 */
export const executeCommand = (command: string, errorMessage?: string): void => {
  try {
    execSync(command, { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } })
  } catch (error) {
    console.error(errorMessage || `Error executing command: ${command}`, error)
    process.exit(1)
  }
}

/**
 * Execute multiple commands in sequence
 * @param commands Array of commands to execute
 * @param taskName Name of the task for error reporting
 */
export const executeCommands = (commands: string[], taskName: string): void => {
  try {
    for (const command of commands) {
      execSync(command, { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } })
    }
  } catch (error) {
    console.error(`Error during ${taskName}:`, error)
    process.exit(1)
  }
}
