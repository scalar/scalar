/**
 * Compatibility diagnostics that prevent a semantics-preserving OpenAPI 3.2 upgrade.
 * Callers may retain the original version; malformed input and clone safety errors
 * use ordinary Errors and must not be treated as a compatibility fallback.
 */
export class UpgradeIncompatibilityError extends AggregateError {
  override errors: Error[]

  constructor(errors: Error[]) {
    super(errors, errors.map((error) => error.message).join('\n'))
    this.errors = errors
    this.name = 'UpgradeIncompatibilityError'
  }
}
