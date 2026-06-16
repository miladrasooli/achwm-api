// Initializes the `staff-action-permissions` service on path `/staff-action-permissions`
import { Application } from '../../declarations'
import createModel from '../../models/staff-action-permissions.model'
import { StaffActionPermissions } from './staff-action-permissions.class'
import hooks from './staff-action-permissions.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'staff-action-permissions': StaffActionPermissions
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
  app.use('staff-action-permissions', new StaffActionPermissions(options, app), {
    methods: ['find', 'get', 'create', 'patch', 'remove', 'replaceForUser'],
  })

  // Get our initialized service so that we can register hooks
  const service = app.service('staff-action-permissions')

  service.hooks(hooks)
}
