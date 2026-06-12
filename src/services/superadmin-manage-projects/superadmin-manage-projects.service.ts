import { Application } from '../../declarations'
import { SuperadminManageProjects } from './superadmin-manage-projects.class'
import hooks from './superadmin-manage-projects.hooks'

declare module '../../declarations' {
  interface ServiceTypes {
    'superadmin-manage-projects': SuperadminManageProjects
  }
}

export default function (app: Application): void {
  app.use('superadmin-manage-projects', new SuperadminManageProjects(app))

  const service = app.service('superadmin-manage-projects')

  service.hooks(hooks)
}
