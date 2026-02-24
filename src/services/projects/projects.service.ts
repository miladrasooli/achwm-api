// Initializes the `projects` service on path `/projects`
import { Application } from '../../declarations'
import createModel from '../../models/projects.model'
import { Projects } from './projects.class'
import hooks from './projects.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    projects: Projects
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
  app.use('projects', new Projects(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('projects')
  service.hooks(hooks)
}
