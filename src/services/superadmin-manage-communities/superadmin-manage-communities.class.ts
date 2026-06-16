import { Params } from '@feathersjs/feathers'

import { Application } from '../../declarations'
import { limitUserFieldsReturnedHelper } from '../../hooks/limitUserFieldsReturned'
import { User } from '../../models/users.model'

type ServiceParams = Params & { user?: User }

type CommunityRecord = {
  id: string
  contact_id?: string | null
  redcap_server_id?: string | null
  [key: string]: unknown
}

type ProjectRecord = {
  id: string
  name: string
  community_id: string
  [key: string]: unknown
}

type MilestoneRecord = {
  id: string
  community_id: string
  created_at: string | Date
  type: string
  message: string
  [key: string]: unknown
}

type AdminCommunityRecord = {
  community_id: string
  user_id: string
  [key: string]: unknown
}

type RedcapServerRecord = {
  id: string
  name: string
  is_default?: boolean
  [key: string]: unknown
}

type UserRecord = {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  [key: string]: unknown
}

const PROJECT_DELIMITER = ', '
const NO_VALUE = 'None'

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

const sortMilestonesDesc = (milestones: MilestoneRecord[]) =>
  [...milestones].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

export type SuperadminManageCommunityRow = CommunityRecord & {
  contact?: Awaited<ReturnType<typeof limitUserFieldsReturnedHelper>>
  contactName: string
  projects: ProjectRecord[]
  projectNames: string
  milestones: MilestoneRecord[]
  serverName?: string
  adminIds: string[]
}

export type SuperadminManageCommunitiesResult = {
  communities: SuperadminManageCommunityRow[]
  potentialContacts: Awaited<ReturnType<typeof limitUserFieldsReturnedHelper>>[]
  potentialServers: RedcapServerRecord[]
  defaultServerId?: string
}

export class SuperadminManageCommunities {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async find(params: ServiceParams = {}): Promise<SuperadminManageCommunitiesResult> {
    // Internal calls only — do not spread external params (provider) into child services.
    const internalParams = { paginate: false as const, user: params.user }
    const requestingUser = params.user as User

    const [communities, users, servers] = await Promise.all([
      this.app.service('communities').find({
        ...internalParams,
        query: {},
      }) as Promise<CommunityRecord[]>,
      this.app.service('users').find({
        ...internalParams,
        query: {},
      }) as Promise<UserRecord[]>,
      this.app.service('redcap-servers').find({
        ...internalParams,
        query: {},
      }) as Promise<RedcapServerRecord[]>,
    ])

    const defaultServer = servers.find((server) => server.is_default)

    const potentialContacts = await Promise.all(
      users.map((user) => limitUserFieldsReturnedHelper(this.app, 'users', user as unknown as User, requestingUser)),
    )
    potentialContacts.sort((a, b) => (a.email ?? '').localeCompare(b.email ?? ''))

    if (communities.length === 0) {
      return {
        communities: [],
        potentialContacts,
        potentialServers: servers,
        defaultServerId: defaultServer?.id,
      }
    }

    const communityIds = communities.map((community) => community.id)

    const [projects, milestones, adminRelationships] = await Promise.all([
      this.app.service('projects').find({
        ...internalParams,
        query: { community_id: { $in: communityIds } },
      }) as Promise<ProjectRecord[]>,
      this.app.service('milestones').find({
        ...internalParams,
        query: { community_id: { $in: communityIds } },
      }) as Promise<MilestoneRecord[]>,
      this.app.service('admins-communities').find({
        ...internalParams,
        query: { community_id: { $in: communityIds } },
      }) as Promise<AdminCommunityRecord[]>,
    ])

    const usersById = new Map(users.map((user) => [user.id, user]))
    const serversById = new Map(servers.map((server) => [server.id, server]))
    const projectsByCommunityId = groupBy(projects, (project) => project.community_id)
    const milestonesByCommunityId = groupBy(milestones, (milestone) => milestone.community_id)
    const adminsByCommunityId = groupBy(adminRelationships, (admin) => admin.community_id)

    const rows: SuperadminManageCommunityRow[] = []

    for (const community of communities) {
      const communityProjects = projectsByCommunityId.get(community.id) ?? []
      const communityMilestones = sortMilestonesDesc(milestonesByCommunityId.get(community.id) ?? [])
      const communityAdmins = adminsByCommunityId.get(community.id) ?? []

      let contact: Awaited<ReturnType<typeof limitUserFieldsReturnedHelper>> | undefined
      let contactName = NO_VALUE

      if (community.contact_id) {
        const contactUser = usersById.get(community.contact_id)

        if (contactUser) {
          contact = await limitUserFieldsReturnedHelper(
            this.app,
            'users',
            contactUser as unknown as User,
            requestingUser,
          )
          contactName = `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() || NO_VALUE
        }
      }

      rows.push({
        ...community,
        contact,
        contactName,
        projects: communityProjects,
        projectNames:
          communityProjects.length > 0
            ? communityProjects.map((project) => project.name).join(PROJECT_DELIMITER)
            : NO_VALUE,
        milestones: communityMilestones,
        serverName: community.redcap_server_id ? serversById.get(community.redcap_server_id)?.name : undefined,
        adminIds: communityAdmins.map((admin) => admin.user_id),
      })
    }

    return {
      communities: rows,
      potentialContacts,
      potentialServers: servers,
      defaultServerId: defaultServer?.id,
    }
  }
}
