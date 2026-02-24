// Initializes the `invitations` service on path `/invitations`
import { Application } from '../../declarations'
import createModel from '../../models/invitations.model'
import { Invitations } from './invitations.class'
import hooks from './invitations.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    invitations: Invitations
  }
}

export default function (app: Application): void {
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    Model,
    paginate,
  }

  // Initialize our service with any options it requires
  app.use('invitations', new Invitations(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('invitations')

  service.hooks(hooks)
}
