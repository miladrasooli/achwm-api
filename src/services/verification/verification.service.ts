// Initializes the `verification` service on path `/verification`
import { Application } from '../../declarations'
import { Verification } from './verification.class'
import hooks from './verification.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    verification: Verification
  }
}

export default function (app: Application): void {
  // Initialize our service with any options it requires
  app.use('verification', new Verification(app))

  // Get our initialized service so that we can register hooks
  const service = app.service('verification')
  service.hooks(hooks)
}
