// Initializes the `staff-actions` service on path `/staff-actions`
import { Application } from '../../declarations'
import createModel from '../../models/staff-actions.model'
import { StaffActions } from './staff-actions.class'
import hooks from './staff-actions.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'staff-actions': StaffActions
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
  app.use('staff-actions', new StaffActions(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('staff-actions')

  service.hooks(hooks)
}
