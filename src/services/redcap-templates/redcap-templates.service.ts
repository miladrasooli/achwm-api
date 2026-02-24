// Initializes the `redcap-templates` service on path `/redcap-templates`
import { Application } from '../../declarations'
import createModel from '../../models/redcap-templates.model'
import { RedcapTemplates } from './redcap-templates.class'
import hooks from './redcap-templates.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'redcap-templates': RedcapTemplates
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
  app.use('redcap-templates', new RedcapTemplates(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('redcap-templates')

  service.hooks(hooks)
}
