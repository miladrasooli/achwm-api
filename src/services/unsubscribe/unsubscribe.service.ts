// Initializes the `unsubscribe` service on path `/unsubscribe`
import { Application } from '../../declarations'
import { Unsubscribe } from './unsubscribe.class'
import hooks from './unsubscribe.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    unsubscribe: Unsubscribe
  }
}

export default function (app: Application): void {
  // Initialize our service with any options it requires
  app.use('unsubscribe', new Unsubscribe(app))

  // Get our initialized service so that we can register hooks
  const service = app.service('unsubscribe')
  service.hooks(hooks)
}
