// Initializes the `participant-uniqueness` service on path `/participant-uniqueness`
import { Application } from '../../declarations'
import { ParticipantUniqueness } from './participant-uniqueness.class'
import hooks from './participant-uniqueness.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'participant-uniqueness': ParticipantUniqueness
  }
}

export default function (app: Application): void {
  // Initialize our service with any options it requires
  app.use('participant-uniqueness', new ParticipantUniqueness(app))

  // Get our initialized service so that we can register hooks
  const service = app.service('participant-uniqueness')

  service.hooks(hooks)
}
