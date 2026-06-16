import { Params } from '@feathersjs/feathers'

import { Application } from '../../declarations'
import { limitUserFieldsForProjectCollaborators } from '../../hooks/limitUserFieldsReturned'
import { RoleEnum } from '../../models/users-projects.model'
import { User } from '../../models/users.model'

type ServiceParams = Params & { user?: User }

type ProjectRecord = {
  id: string
  community_id: string
  redcap_template_id?: string | null
  [key: string]: unknown
}

type CommunityRecord = {
  id: string
  name: string
  license_expiry?: string | Date
  [key: string]: unknown
}

type UserProjectRecord = {
  id: string
  user_id: string
  project_id: string
  project_role: RoleEnum
  [key: string]: unknown
}

type DatasetRecord = {
  id: string
  name: string
  project_id: string
  [key: string]: unknown
}

type RedcapTemplateRecord = {
  id: string
  name: string
  [key: string]: unknown
}

type UserRecord = {
  id: string
  first_name: string
  last_name: string
  [key: string]: unknown
}

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

export type SuperadminManageProjectMember = ReturnType<typeof limitUserFieldsForProjectCollaborators> & {
  roleForThisProject: RoleEnum
}

export type SuperadminManageProjectRow = ProjectRecord & {
  community: CommunityRecord
  templateName: string
  members: SuperadminManageProjectMember[]
  datasets: DatasetRecord[]
}

export class SuperadminManageProjects {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async find(params: ServiceParams = {}): Promise<SuperadminManageProjectRow[]> {
    // Internal calls only — do not spread external params (provider) into child services.
    const internalParams = { paginate: false as const, user: params.user }

    const projects = (await this.app.service('projects').find({
      ...internalParams,
      query: {},
    })) as ProjectRecord[]

    if (projects.length === 0) {
      return []
    }

    const projectIds = projects.map((project) => project.id)
    const communityIds = [...new Set(projects.map((project) => project.community_id))]
    const templateIds = [
      ...new Set(projects.map((project) => project.redcap_template_id).filter(Boolean) as string[]),
    ]

    const [communities, userProjects, datasets, templates] = await Promise.all([
      this.app.service('communities').find({
        ...internalParams,
        query: { id: { $in: communityIds } },
      }) as Promise<CommunityRecord[]>,
      this.app.service('users-projects').find({
        ...internalParams,
        query: { project_id: { $in: projectIds } },
      }) as Promise<UserProjectRecord[]>,
      this.app.service('datasets').find({
        ...internalParams,
        query: { project_id: { $in: projectIds } },
      }) as Promise<DatasetRecord[]>,
      templateIds.length > 0
        ? (this.app.service('redcap-templates').find({
            ...internalParams,
            query: { id: { $in: templateIds } },
          }) as Promise<RedcapTemplateRecord[]>)
        : Promise.resolve([] as RedcapTemplateRecord[]),
    ])

    const userIds = [...new Set(userProjects.map((userProject) => userProject.user_id))]
    const users =
      userIds.length > 0
        ? ((await this.app.service('users').find({
            ...internalParams,
            query: { id: { $in: userIds } },
          })) as UserRecord[])
        : []

    const communitiesById = new Map(communities.map((community) => [community.id, community]))
    const membersByProjectId = groupBy(userProjects, (userProject) => userProject.project_id)
    const datasetsByProjectId = groupBy(datasets, (dataset) => dataset.project_id)
    const templatesById = new Map(templates.map((template) => [template.id, template]))
    const usersById = new Map(users.map((user) => [user.id, user]))
    const requestingUser = params.user as User

    return projects.map((project) => {
      const members = (membersByProjectId.get(project.id) ?? [])
        .map((userProject) => {
          const user = usersById.get(userProject.user_id)

          if (!user) {
            return null
          }

          return {
            ...limitUserFieldsForProjectCollaborators(user as unknown as User, requestingUser, userProject.project_role),
            roleForThisProject: userProject.project_role,
          }
        })
        .filter((member): member is SuperadminManageProjectMember => member !== null)

      return {
        ...project,
        community: communitiesById.get(project.community_id)!,
        templateName: project.redcap_template_id ? templatesById.get(project.redcap_template_id)?.name ?? '' : '',
        members,
        datasets: datasetsByProjectId.get(project.id) ?? [],
      }
    })
  }
}
