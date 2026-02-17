export { DATA_VERSION, DATA_VERSION_LS_LEY } from './data-version'
export {
  clearLegacyLocalStorage,
  migrateLocalStorageToIndexDb,
  shouldMigrateToIndexDb,
  transformLegacyDataToWorkspace,
} from './migrate-to-indexdb'
export { migrator } from './migrator'
export { semverLessThan } from './semver'
