import { Application } from '../../declarations'
import { DashboardService } from './dashboard-service.class'
import hooks from './dashboard-service.hooks'

declare module '../../declarations' {
  interface ServiceTypes {
    'dashboard-service': DashboardService
  }
}

export default function (app: Application): void {
  app.use('dashboard-service', new DashboardService(app))

  const service = app.service('dashboard-service')

  service.hooks(hooks)
}
