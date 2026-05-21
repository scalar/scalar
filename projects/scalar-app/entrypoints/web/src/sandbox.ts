/**
 * Bootstraps the script sandbox inside its isolated iframe realm.
 *
 * Importing this pulls in postman-sandbox (which uses eval), so it must only run in `sandbox.html`,
 * never in the main application bundle.
 */
import '@scalar/pre-post-request-scripts/sandbox'
