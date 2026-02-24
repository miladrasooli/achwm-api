// Initializes the `offline-data` service on path `/offline-data`
import { Application } from '../../declarations'
import { OfflineData } from './offline-data.class'
import hooks from './offline-data.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'offline-data': OfflineData
  }
}

export default function (app: Application): void {
  // Initialize our service with any options it requires
  app.use('offline-data', new OfflineData(app))

  // Get our initialized service so that we can register hooks
  const service = app.service('offline-data')

  service.hooks(hooks)
}
