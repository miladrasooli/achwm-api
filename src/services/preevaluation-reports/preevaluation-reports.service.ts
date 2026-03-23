// Initializes the `preevaluation-reports` service on path `/preevaluation-reports`
import { Application } from '../../declarations'
import { PreevaluationReports } from './preevaluation-reports.class'
import hooks from './preevaluation-reports.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'preevaluation-reports': PreevaluationReports
  }
}

export default function (app: Application): void {
  // Initialize our service with any options it requires
  app.use('preevaluation-reports', new PreevaluationReports(app))

  // Get our initialized service so that we can register hooks
  const service = app.service('preevaluation-reports')

  service.hooks(hooks)
}
