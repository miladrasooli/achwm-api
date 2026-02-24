// Initializes the `offline-sessions` service on path `/offline-sessions`
import { Application } from '../../declarations'
import createModel from '../../models/offline-sessions.model'
import { OfflineSessions } from './offline-sessions.class'
import hooks from './offline-sessions.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'offline-sessions': OfflineSessions
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
  app.use('offline-sessions', new OfflineSessions(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('offline-sessions')

  service.hooks(hooks)
}
