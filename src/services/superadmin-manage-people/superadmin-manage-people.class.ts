import { Params } from '@feathersjs/feathers'

import { Application } from '../../declarations'
import { limitUserFieldsReturnedHelper } from '../../hooks/limitUserFieldsReturned'
import { ROLE_NAMES, RoleEnum } from '../../models/users-projects.model'
import { User } from '../../models/users.model'

type ServiceParams = Params & { user?: User }

type UserRecord = {
  id: string
  [key: string]: unknown
}

type UserProjectRecord = {
  user_id: string
  project_id: string
  project_role: RoleEnum
  [key: string]: unknown
}

type ProjectRecord = {
  id: string
  name: string
  [key: string]: unknown
}

const LIST_DELIMITER = ', '
const NO_ROLES = 'None'

const groupBy = <T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> => {
  const groups = new Map<string, T[]>()

  for (const item of items) {
    const key = keyFn(item)
    const group = groups.get(key)

    if (group) {
      group.push(item)
    } else {
      groups.set(key, [item])
    }
  }

  return groups
}

export type SuperadminManagePeopleRow = Awaited<ReturnType<typeof limitUserFieldsReturnedHelper>> & {
  roles: string
}

export class SuperadminManagePeople {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async find(params: ServiceParams = {}): Promise<SuperadminManagePeopleRow[]> {
    // Internal calls only — do not spread external params (provider) into child services.
    const internalParams = { paginate: false as const, user: params.user }

    const users = (await this.app.service('users').find({
      ...internalParams,
      query: {},
    })) as UserRecord[]

    if (users.length === 0) {
      return []
    }

    const userIds = users.map((user) => user.id)

    const userProjects = (await this.app.service('users-projects').find({
      ...internalParams,
      query: {
        user_id: { $in: userIds },
        $select: ['user_id', 'project_role', 'project_id'],
      },
    })) as UserProjectRecord[]

    const projectIds = [...new Set(userProjects.map((userProject) => userProject.project_id))]
    const projects =
      projectIds.length > 0
        ? ((await this.app.service('projects').find({
            ...internalParams,
            query: {
              id: { $in: projectIds },
              $select: ['id', 'name'],
            },
          })) as ProjectRecord[])
        : []

    const projectsById = new Map(projects.map((project) => [project.id, project]))
    const userProjectsByUserId = groupBy(userProjects, (userProject) => userProject.user_id)
    const requestingUser = params.user as User

    const rows: SuperadminManagePeopleRow[] = []

    for (const user of users) {
      const limitedUser = await limitUserFieldsReturnedHelper(this.app, 'users', user as unknown as User, requestingUser)
      const roles = userProjectsByUserId.get(user.id) ?? []

      let rolesString: string
      if (roles.length === 0) {
        rolesString = NO_ROLES
      } else {
        rolesString = roles
          .map((role) => {
            const projectName = projectsById.get(role.project_id)?.name ?? ''
            const roleName = ROLE_NAMES[role.project_role as RoleEnum] || role.project_role
            return `${roleName} for ${projectName}`
          })
          .sort((a, b) => a.localeCompare(b))
          .join(LIST_DELIMITER)
      }

      rows.push({
        ...limitedUser,
        roles: rolesString,
      })
    }

    return rows
  }
}
