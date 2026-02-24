// Initializes the `superadmin-table-settings` service on path `/admins-communities`
import { Application } from '../../declarations'
import createModel from '../../models/superadmin-table-settings.model'
import { SuperadminTableSettings } from './superadmin-table-settings.class'
import hooks from './superadmin-table-settings.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'superadmin-table-settings': SuperadminTableSettings
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
  app.use('superadmin-table-settings', new SuperadminTableSettings(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('superadmin-table-settings')

  service.hooks(hooks)
}
