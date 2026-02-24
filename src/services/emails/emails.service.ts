// Initializes the `emails` service on path `/emails`
import { Application } from '../../declarations'
import createModel from '../../models/emails.model'
import { Emails } from './emails.class'
import hooks from './emails.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    emails: Emails
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
  app.use('emails', new Emails(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('emails')
  service.hooks(hooks)
}
