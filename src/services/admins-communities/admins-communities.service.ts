// Initializes the `admins-communities` service on path `/admins-communities`
import { Application } from '../../declarations'
import createModel from '../../models/admins-communities.model'
import { AdminsCommunities } from './admins-communities.class'
import hooks from './admins-communities.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'admins-communities': AdminsCommunities
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
  app.use('admins-communities', new AdminsCommunities(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('admins-communities')

  service.hooks(hooks)
}
