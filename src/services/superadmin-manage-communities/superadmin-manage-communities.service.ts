import { Application } from '../../declarations'
import { SuperadminManageCommunities } from './superadmin-manage-communities.class'
import hooks from './superadmin-manage-communities.hooks'

declare module '../../declarations' {
  interface ServiceTypes {
    'superadmin-manage-communities': SuperadminManageCommunities
  }
}

export default function (app: Application): void {
  app.use('superadmin-manage-communities', new SuperadminManageCommunities(app))

  const service = app.service('superadmin-manage-communities')

  service.hooks(hooks)
}
