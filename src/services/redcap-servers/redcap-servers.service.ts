// Initializes the `redcap-servers` service on path `/redcap-servers`
import { Application } from '../../declarations'
import createModel from '../../models/redcap-servers.model'
import { RedcapServers } from './redcap-servers.class'
import hooks from './redcap-servers.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'redcap-servers': RedcapServers
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
  app.use('redcap-servers', new RedcapServers(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('redcap-servers')

  service.hooks(hooks)
}
