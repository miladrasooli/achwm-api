// Initializes the `datasets` service on path `/datasets`
import { Application } from '../../declarations'
import createModel from '../../models/datasets.model'
import { Datasets } from './datasets.class'
import hooks from './datasets.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    datasets: Datasets
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
  app.use('datasets', new Datasets(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('datasets')

  service.hooks(hooks)
}
