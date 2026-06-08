import type { XScalarSdkInstallation } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-sdk-installation'

/** The array shape stored under `x-scalar-sdk-installation`. */
type SdkInstallationList = NonNullable<XScalarSdkInstallation['x-scalar-sdk-installation']>

/**
 * The SDK installation entries that actually have something to render.
 *
 * Entries that only carry a `lang` (no `description`) are ignored so the UI can
 * fall back to the generic client selector instead of showing an empty card.
 * Both the gate in `Content.vue` and the tab list in the block rely on this, so
 * the "has instructions" rule lives in one place.
 *
 * The value comes straight from an untrusted OpenAPI document, so a malformed
 * extension (a single object, a string, …) is treated as "no instructions"
 * rather than allowed to throw at render time.
 */
export const getRenderableSdks = (xScalarSdkInstallation: SdkInstallationList | undefined): SdkInstallationList =>
  Array.isArray(xScalarSdkInstallation) ? xScalarSdkInstallation.filter((sdk) => Boolean(sdk?.description)) : []
