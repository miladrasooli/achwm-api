// Initializes the `redcap` service on path `/redcap`
import { Application } from '../../declarations'
import { Redcap } from './redcap.class'
import hooks from './redcap.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    redcap: Redcap
  }
}

export default function (app: Application): void {
  // Initialize our service with any options it requires
  app.use('redcap', new Redcap(app))

  // Get our initialized service so that we can register hooks
  const service = app.service('redcap')
  service.hooks(hooks)
}
