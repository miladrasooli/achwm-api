// Initializes the `surveys` service on path `/surveys`
import { Application } from '../../declarations'
import { Surveys } from './surveys.class'
import hooks from './surveys.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    surveys: Surveys
  }
}

export default function (app: Application): void {
  // Initialize our service with any options it requires
  app.use('surveys', new Surveys(app))

  // Get our initialized service so that we can register hooks
  const service = app.service('surveys')

  service.hooks(hooks)
}
