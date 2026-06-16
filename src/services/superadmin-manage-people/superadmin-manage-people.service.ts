import { Application } from '../../declarations'
import { SuperadminManagePeople } from './superadmin-manage-people.class'
import hooks from './superadmin-manage-people.hooks'

declare module '../../declarations' {
  interface ServiceTypes {
    'superadmin-manage-people': SuperadminManagePeople
  }
}

export default function (app: Application): void {
  app.use('superadmin-manage-people', new SuperadminManagePeople(app))

  const service = app.service('superadmin-manage-people')

  service.hooks(hooks)
}
