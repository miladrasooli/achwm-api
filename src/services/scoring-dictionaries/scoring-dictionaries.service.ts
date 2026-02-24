// Initializes the `scoring-dictionaries` service on path `/scoring-dictionaries`
import { Application } from '../../declarations'
import { ScoringDictionaries } from './scoring-dictionaries.class'
import hooks from './scoring-dictionaries.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'scoring-dictionaries': ScoringDictionaries
  }
}

export default function (app: Application): void {
  // Initialize our service with any options it requires
  app.use('scoring-dictionaries', new ScoringDictionaries(app))

  // Get our initialized service so that we can register hooks
  const service = app.service('scoring-dictionaries')

  service.hooks(hooks)
}
