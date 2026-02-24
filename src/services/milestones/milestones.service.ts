// Initializes the `milestones` service on path `/milestones`
import { Application } from '../../declarations'
import createModel from '../../models/milestones.model'
import { Milestones } from './milestones.classes'
import hooks from './milestones.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    milestones: Milestones
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
  app.use('milestones', new Milestones(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('milestones')

  service.hooks(hooks)
}
