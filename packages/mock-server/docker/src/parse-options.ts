/** Options the Docker entrypoint reads from its command line and environment. */
type DockerOptions = {
  /** URL of the API description to fetch, from `--url <URL>`. */
  url?: string
  /** Whether the mock server rejects requests that violate the API description with `422`. */
  validateRequest: boolean
}

/** Command-line flag that turns request validation off. */
const NO_VALIDATE_REQUEST_FLAG = '--no-validate-request'

/** Environment variable that turns request validation on or off. */
const VALIDATE_REQUEST_ENV = 'VALIDATE_REQUEST'

/**
 * Read `VALIDATE_REQUEST` as a boolean, keeping validation on when it is unset or empty.
 *
 * An unrecognized value throws instead of falling back to the default: a typo such as `flase`
 * would otherwise leave validation on, and the container would answer `422` with nothing in the
 * logs pointing at the variable.
 */
const parseValidateRequestEnv = (value: string | undefined): boolean => {
  const normalized = value?.trim().toLowerCase()

  if (!normalized || normalized === 'true' || normalized === '1') {
    return true
  }

  if (normalized === 'false' || normalized === '0') {
    return false
  }

  throw new Error(`${VALIDATE_REQUEST_ENV} must be "true" or "false" (or "1" or "0"), received "${value}"`)
}

/**
 * Parse the Docker entrypoint's command-line arguments and environment.
 *
 * Request validation stays on unless `--no-validate-request` is passed or `VALIDATE_REQUEST` is
 * `false`. The flag only turns validation off, so it wins over the environment variable either way.
 *
 * @param args - Command-line arguments without the node binary and script path.
 * @param env - The environment to read `VALIDATE_REQUEST` from.
 */
export const parseOptions = (args: readonly string[], env: Record<string, string | undefined>): DockerOptions => {
  let url: string | undefined
  let disableValidation = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    // --url <URL>
    if (arg === '--url' && i + 1 < args.length) {
      const value = args[i + 1]?.trim()
      if (value) {
        url = value
      }
      i++ // Skip next argument
    } else if (arg === NO_VALIDATE_REQUEST_FLAG) {
      disableValidation = true
    }
  }

  // Parse the variable even when the flag is set, so an invalid value is reported rather than hidden.
  const validateRequestEnv = parseValidateRequestEnv(env[VALIDATE_REQUEST_ENV])

  return {
    ...(url ? { url } : {}),
    validateRequest: !disableValidation && validateRequestEnv,
  }
}
