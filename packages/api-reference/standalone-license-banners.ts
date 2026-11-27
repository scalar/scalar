import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import packageJson from './package.json' with { type: 'json' }

const { name, version } = packageJson

// Opens with `/*!` (a legal comment) rather than `/**` so the oxc minifier keeps it
// when `output.comments.legal` is enabled. See the `banner`/`comments` output options.
/** Scalar product and version banner shared by both browser build formats. */
export const licenseBanner = String.raw`/*!
 *    _____ _________    __    ___    ____
 *   / ___// ____/   |  / /   /   |  / __ \
 *   \__ \/ /   / /| | / /   / /| | / /_/ /
 *  ___/ / /___/ ___ |/ /___/ ___ |/ _, _/
 * /____/\____/_/  |_/_____/_/  |_/_/ |_|
 *
 * ${name} ${version}
 *
 * Website: https://scalar.com
 * GitHub:  https://github.com/scalar/scalar
 * License: https://github.com/scalar/scalar/blob/main/LICENSE
**/
`

/** Legal comment with the upstream notices for the bundled parser. */
export const parserNotice = `/*!\n${readFileSync(resolve(import.meta.dirname, 'THIRD_PARTY_NOTICES'), 'utf8')}*/\n`
