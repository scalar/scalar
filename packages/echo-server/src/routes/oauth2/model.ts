import crypto from 'crypto'

import { db } from './db'

export const model = {
  getClient: function (clientId, clientSecret) {
    // query db for details with client
    console.log({
      title: 'Get Client',
      parameters: [
        { name: 'clientId', value: clientId },
        { name: 'clientSecret', value: clientSecret },
      ],
    })
    db.client = {
      // Retrieved from the database
      clientId: clientId,
      clientSecret: clientSecret,
      grants: ['authorization_code', 'refresh_token'],
      redirectUris: ['http://localhost:3030/client/app'],
    }
    return new Promise((resolve) => {
      resolve(db.client)
    })
  },
  // generateAccessToken: (client, user, scope) => { // generates access tokens
  //   log({
  //     title: 'Generate Access Token',
  //     parameters: [
  //       {name: 'client', value: client},
  //       {name: 'user', value: user},
  //     ],
  //   })
  //
  // },
  saveToken: (token, client, user) => {
    /* This is where you insert the token into the database */
    console.log({
      title: 'Save Token',
      parameters: [
        { name: 'token', value: token },
        { name: 'client', value: client },
        { name: 'user', value: user },
      ],
    })
    db.token = {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      refreshToken: token.refreshToken, // NOTE this is only needed if you need refresh tokens down the line
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      client: client,
      user: user,
    }
    return new Promise((resolve) => resolve(db.token))
  },
  getAccessToken: (token) => {
    /* This is where you select the token from the database where the code matches */
    console.log({
      title: 'Get Access Token',
      parameters: [{ name: 'token', value: token }],
    })
    if (!token || token === 'undefined') return false
    return new Promise((resolve) => resolve(db.token))
  },
  getRefreshToken: (token) => {
    /* Retrieves the token from the database */
    console.log({
      title: 'Get Refresh Token',
      parameters: [{ name: 'token', value: token }],
    })
    console.log({ name: 'db.token', value: db.token })
    return new Promise((resolve) => resolve(db.token))
  },
  revokeToken: (token) => {
    /* Delete the token from the database */
    console.log({
      title: 'Revoke Token',
      parameters: [{ name: 'token', value: token }],
    })
    if (!token || token === 'undefined') return false
    return new Promise((resolve) => resolve(true))
  },
  generateAuthorizationCode: (client, user, scope) => {
    /*
      For this to work, you are going have to hack this a little bit:
      1. navigate to the node_modules folder
      2. find the oauth_server folder. (node_modules/express-oauth-server/node_modules/oauth2-server)
      3. open lib/handlers/authorize-handler.js
      4. Make the following change (around line 136):

      AuthorizeHandler.prototype.generateAuthorizationCode = function (client, user, scope) {
        if (this.model.generateAuthorizationCode) {
          // Replace this
          //return promisify(this.model.generateAuthorizationCode).call(this.model, client, user, scope);
          // With this
          return this.model.generateAuthorizationCode(client, user, scope)
        }
        return tokenUtil.generateRandomToken();
      };
      */

    console.log({
      title: 'Generate Authorization Code',
      parameters: [
        { name: 'client', value: client },
        { name: 'user', value: user },
      ],
    })

    const seed = crypto.randomBytes(256)
    const code = crypto.createHash('sha1').update(seed).digest('hex')
    return code
  },
  saveAuthorizationCode: (code, client, user) => {
    /* This is where you store the access code data into the database */
    console.log({
      title: 'Save Authorization Code',
      parameters: [
        { name: 'code', value: code },
        { name: 'client', value: client },
        { name: 'user', value: user },
      ],
    })
    db.authorizationCode = {
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      client: client,
      user: user,
    }
    return new Promise((resolve) =>
      resolve(
        Object.assign(
          {
            redirectUri: `${code.redirectUri}`,
          },
          db.authorizationCode,
        ),
      ),
    )
  },
  getAuthorizationCode: (authorizationCode) => {
    /* this is where we fetch the stored data from the code */
    console.log({
      title: 'Get Authorization code',
      parameters: [{ name: 'authorizationCode', value: authorizationCode }],
    })
    return new Promise((resolve) => {
      resolve(db.authorizationCode)
    })
  },
  revokeAuthorizationCode: (authorizationCode) => {
    /* This is where we delete codes */
    console.log({
      title: 'Revoke Authorization Code',
      parameters: [{ name: 'authorizationCode', value: authorizationCode }],
    })
    db.authorizationCode = {
      // DB Delete in this in memory example :)
      authorizationCode: '', // A string that contains the code
      expiresAt: new Date(), // A date when the code expires
      redirectUri: '', // A string of where to redirect to with this code
      client: null, // See the client section
      user: null, // Whatever you want... This is where you can be flexible with the protocol
    }
    const codeWasFoundAndDeleted = true // Return true if code found and deleted, false otherwise
    return new Promise((resolve) => resolve(codeWasFoundAndDeleted))
  },
  verifyScope: (token, scope) => {
    /* This is where we check to make sure the client has access to this scope */
    console.log({
      title: 'Verify Scope',
      parameters: [
        { name: 'token', value: token },
        { name: 'scope', value: scope },
      ],
    })
    const userHasAccess = true // return true if this user / client combo has access to this resource
    return new Promise((resolve) => resolve(userHasAccess))
  },
}
