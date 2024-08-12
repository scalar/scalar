export enum AdminLevel {
  SuperAdmin = 'superAdmin',
  Admin = 'admin',
}

/** Super access tokens are used to grant read-only access to any collection path */
export type SuperAccessTokenPayload = {
  uid: string
  email: string | null
  role: AdminLevel
  exp: number
}
