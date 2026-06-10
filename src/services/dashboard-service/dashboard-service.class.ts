import dayjs from 'dayjs'

import { NotAuthenticated } from '@feathersjs/errors'

import { Application } from '../../declarations'
import { CommunityStatusEnum } from '../../models/communities.model'
import { ProjectStatusEnum } from '../../models/projects.model'

type UserProjectRecord = {
  project_id: string
}

type AdminCommunityRecord = {
  id: string
  community_id: string
  is_first_login: boolean
}

type ProjectRecord = {
  id: string
  status: string
  created_at?: string
  [key: string]: unknown
}

type CommunityRecord = {
  id: string
  status: CommunityStatusEnum
  platform_license_document_link?: string
}

type DashboardProjectSummary = {
  project: ProjectRecord
  numberOfParticipants: number
  numberOfCollaborators: number
}

export class DashboardService {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async find(params: { user?: { id?: string } }) {
    const userId = params.user?.id

    if (!userId) {
      throw new NotAuthenticated()
    }

    const userProjects = (await this.app.service('users-projects').find({
      paginate: false,
      query: {
        user_id: userId,
      },
    })) as UserProjectRecord[]

    const adminCommunityRelations = (await this.app.service('admins-communities').find({
      paginate: false,
      query: {
        user_id: userId,
      },
    })) as AdminCommunityRecord[]

    const [projects, adminCommunities] = await Promise.all([
      Promise.all(userProjects.map((userProject) => this.app.service('projects').get(userProject.project_id as string))),
      Promise.all(
        adminCommunityRelations.map((relationship) => this.app.service('communities').get(relationship.community_id as string)),
      ),
    ])

    const visibleProjects = projects.filter((project) => project.status !== ProjectStatusEnum.ARCHIVED)

    const dashboardProjects = await Promise.all(
      visibleProjects.map(async (project) => {
        const [participantCount, collaborators] = await Promise.all([
          this.app.service('participants').find({
            query: {
              project_id: project.id,
              count: true,
            },
          }),
          this.app.service('users-projects').find({
            paginate: false,
            query: {
              project_id: project.id,
            },
          }),
        ])

        return {
          project,
          numberOfParticipants: Number(participantCount),
          numberOfCollaborators: (collaborators as UserProjectRecord[]).length,
        }
      }),
    )

    dashboardProjects.sort((a: DashboardProjectSummary, b: DashboardProjectSummary) => {
      if (a.project.status !== b.project.status) {
        return a.project.status.localeCompare(b.project.status)
      }

      const aCreatedAt = dayjs(a.project.created_at)
      const bCreatedAt = dayjs(b.project.created_at)

      if (aCreatedAt.isBefore(bCreatedAt)) {
        return 1
      }

      return -1
    })

    const activeAdminCommunity = adminCommunities.find((community) => community.status === CommunityStatusEnum.ACTIVE)
    const activeAdminCommunityRelation = adminCommunityRelations.find((relationship) =>
      adminCommunities.some(
        (community) => community.id === relationship.community_id && community.status === CommunityStatusEnum.ACTIVE,
      ),
    )

    return {
      projects: dashboardProjects,
      showCreateProjectCard: userProjects.length === 0 && Boolean(activeAdminCommunity),
      showStartProjectButton: userProjects.length > 0 && Boolean(activeAdminCommunity),
      congratulationsAdminCommunityId: activeAdminCommunityRelation?.is_first_login ? activeAdminCommunityRelation.id : null,
      pendingCommunityDocumentLinks: adminCommunities
        .filter((community) => community.status === CommunityStatusEnum.PENDING && community.platform_license_document_link)
        .map((community) => community.platform_license_document_link),
      showWantToStartProjectCard: userProjects.length === 0 && adminCommunityRelations.length === 0,
    }
  }
}
