// Initializes the `users-projects` service on path `/users-projects`
import { Application } from '../../declarations'
import createModel from '../../models/users-projects.model'
import { UsersProjects } from './users-projects.class'
import hooks from './users-projects.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'users-projects': UsersProjects
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
  app.use('users-projects', new UsersProjects(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('users-projects')

  service.hooks(hooks)
}
