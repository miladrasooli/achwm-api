// Initializes the `participants` service on path `/participants`
import { Application } from '../../declarations'
import { Participants } from './participants.class'
import hooks from './participants.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    participants: Participants
  }
}

export default function (app: Application): void {
  // Initialize our service with any options it requires
  app.use('participants', new Participants(app))

  // Get our initialized service so that we can register hooks
  const service = app.service('participants')

  service.hooks(hooks)
}
