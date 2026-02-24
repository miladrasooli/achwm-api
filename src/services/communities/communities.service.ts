// Initializes the `communities` service on path `/communities`
import { Application } from '../../declarations'
import createModel from '../../models/communities.model'
import { Communities } from './communities.class'
import hooks from './communities.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    communities: Communities
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
  app.use('communities', new Communities(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('communities')

  service.hooks(hooks)
}
