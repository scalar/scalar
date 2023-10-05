import Express from 'express'
import OAuthServer from 'express-oauth-server'

import { model } from './oauth2/model'

const OAuthServerInstance = new OAuthServer({
  model: model,
  grants: ['authorization_code', 'refresh_token'],
  accessTokenLifetime: 60 * 60 * 24, // 24 hours, or 1 day
  allowEmptyState: true,
  allowExtendedTokenAttributes: true,
})

const router = Express.Router() as Express.Router

router.get('/', (req, res, next) => {
  res.send('OK')
})

router.get(
  '/authorize',
  (req, res, next) => {
    // console.log('Initial User Authentication')
    // const { username, password } = req.body
    // if (username === 'username' && password === 'password') {
    //   req.body.user = { user: 1 }
    //   return next()
    // }
    const params = [
      // Send params back down
      'client_id',
      'redirect_uri',
      'response_type',
      'grant_type',
      'state',
    ]
      .map((a) => `${a}=${req.body[a]}`)
      .join('&')
    return res.redirect(`/oauth2?success=false&${params}`)
  },
  (req, res, next) => {
    // sends us to our redirect with an authorization code in our url
    console.log('Authorization')
    // return next()
  },
  OAuthServerInstance.authorize({
    authenticateHandler: {
      handle: (req) => {
        console.log('Authenticate Handler')
        console.log(
          Object.keys(req.body).map((k) => ({ name: k, value: req.body[k] })),
        )
        return req.body.user
      },
    },
  }),
)

router.post(
  '/token',
  (req, res, next) => {
    console.log('Token')
  },
  OAuthServerInstance.token({
    requireClientAuthentication: {
      // whether client needs to provide client_secret
      // 'authorization_code': false,
    },
  }),
) // Sends back token

export default router
