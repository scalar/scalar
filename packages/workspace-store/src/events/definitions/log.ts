/**
 * Used for generic logging, debugging and analytics
 */
export type LogEvents = {
  /** Fired when the user clicks any login button */
  'log:login-click': undefined
  /** Fired when the user clicks the register button */
  'log:register-click': undefined
  /** Fired when a user successfully authenticates */
  'log:user-login': {
    uid: string
    email?: string
    teamUid: string
  }
  /** Fired when the current user logs out */
  'log:user-logout': undefined
  /** Fired when the user saves a document locally */
  'log:save-document': undefined
  /** Fired when the user initiates a pull from the registry */
  'log:sync-pull-document': undefined
  /** Fired when the user successfully pushes a document to the registry */
  'log:sync-push-document': undefined
}
