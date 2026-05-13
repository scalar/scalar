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
}
