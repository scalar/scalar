// eslint-disable-next-line no-undef
const fs = require('fs')
// eslint-disable-next-line no-undef
// const { notarize } = require('electron-notarize')

// eslint-disable-next-line no-undef
exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  const { appName: appName } = context.packager.appInfo

  if (electronPlatformName !== 'darwin') {
    return
  }

  const file = `${appOutDir}/${appName}.app`

  // Check if the file exists
  if (!fs.existsSync(file)) {
    console.log()
    console.error(
      `Failed to notarize the app. The file does not exist: ${file}`,
    )
    console.log()
    return
  }

  console.log()
  console.log(`📦 Notarizing ${appName}…`)
  console.log()
  console.warn('⚠️ Notarization is not yet implemented.')
  console.log()

  // TODO: Replace with the environment variables we actually need
  // if (
  //   // eslint-disable-next-line no-undef
  //   process.env.APPLE_ID === undefined ||
  //   // eslint-disable-next-line no-undef
  //   process.env.APPLE__ID_PASS === undefined
  // ) {
  //   console.error(
  //     '⚠️ Please provide the APPLE_ID and APPLE_ID_PASS environment variables.',
  //   )
  //   return
  // }

  // await notarize({
  //   appBundleId: 'com.yourcompany.yourAppId',
  //   appPath: `${appOutDir}/${appName}.app`,
  //   // eslint-disable-next-line no-undef
  //   appleId: process.env.APPLE_ID,
  //   // eslint-disable-next-line no-undef
  //   appleIdPassword: process.env.APPLE_ID_PASS,
  // })
}
