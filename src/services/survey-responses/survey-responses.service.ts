// Initializes the `survey-responses` service on path `/survey-responses`
import { Application } from '../../declarations'
import { SurveyResponses } from './survey-responses.class'
import hooks from './survey-responses.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'survey-responses': SurveyResponses
  }
}

export default function (app: Application): void {
  // Initialize our service with any options it requires
  app.use('survey-responses', new SurveyResponses(app))

  // Get our initialized service so that we can register hooks
  const service = app.service('survey-responses')

  service.hooks(hooks)
}
