// Initializes the `auth-management` service on path `/auth_management`
import { AuthenticationManagementService } from 'feathers-authentication-management'

import { Application } from '../../declarations'
import hooks from './auth-management.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'auth-management': AuthenticationManagementService
  }
}

export default function (app: Application): void {
  const delay = 1000 * 60 * 30 // 30 mins to verify email
  const resetDelay = 1000 * 60 * 60 // 1 hour to reset password
  const options = {
    delay,
    resetDelay,
    sanitizeUserForClient: () => ({ status: 200 }),
    reuseResetToken: true,
    // Passwords are hashed with hashPassword hook later
    skipPasswordHash: true,
    // Allow passwords to be reset even if user is not verified
    skipIsVerifiedCheck: true,
  }

  app.use('auth-management', new AuthenticationManagementService(app, options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('auth-management')

  service.hooks(hooks)
}
