import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { Forbidden, NotFound } from '@feathersjs/errors'
import { disallow, iff, isProvider, validate, ValidatorFn } from 'feathers-hooks-common'

import { HookContext, HookOptions } from '../../declarations'
import { AdminsCommunities } from './admins-communities.class'
import { Id, Paginated } from '@feathersjs/feathers'
import { Project } from '../../models/projects.model'
import { RoleEnum, UserProject } from '../../models/users-projects.model'

import globalHooks from '../../hooks'

const restrictToOwnUserId = () => async (context: HookContext) => {
  const { id, method, params, service } = context
  const { query, user } = params

  const userId = user.id

  if (method === 'find') {
    query.user_id = userId
  } else if (method === 'patch') {
    const adminCommunity = await service.get(id)
    if (adminCommunity.user_id !== userId) {
      throw new NotFound(`No record found for id '${id}'`)
    }
  } else {
    throw new Error('restrictToOwnUserId is currently only configured for "find" and "patch" methods')
  }
}

const addToUsersProjects = () => async (context: HookContext) => {
  const { app, result, params } = context
  const { community_id, user_id } = result

  if (params.skipSyncAdminsCommunitiesAndUsersProjects) {
    return context
  }

  // Get projects associated with this community
  const projects = (
    (await app.service('projects').find({
      query: {
        community_id,
        $select: ['id'],
      },
    })) as Paginated<Project>
  ).data

  // Add record to users-projects for each project
  for (const project of projects) {
    const project_id = project.id
    const existingUserProject = (
      (await app.service('users-projects').find({
        query: {
          user_id,
          project_id,
        },
      })) as Paginated<UserProject>
    ).data

    if (existingUserProject.length > 0) {
      // Make user admin
      if (existingUserProject[0].project_role < RoleEnum.ADMIN) {
        await app.service('users-projects').patch(
          existingUserProject[0].id as unknown as Id,
          {
            project_role: RoleEnum.ADMIN,
          },
          { skipSyncAdminsCommunitiesAndUsersProjects: true } as any,
        )
      }
    } else {
      // Add user to project as admin
      await app.service('users-projects').create(
        {
          user_id,
          project_id,
          project_role: RoleEnum.ADMIN,
        },
        { skipSyncAdminsCommunitiesAndUsersProjects: true } as any,
      )
    }
  }
}

const removeFromUsersProjects = () => async (context: HookContext) => {
  const { app, result, params } = context
  const { community_id, user_id } = result

  if (params.skipSyncAdminsCommunitiesAndUsersProjects) {
    return context
  }

  // Get projects associated with this community
  const projects = (
    (await app.service('projects').find({
      query: {
        community_id,
        $select: ['id'],
      },
    })) as Paginated<Project>
  ).data

  // Remove user from projects for this community
  for (const project of projects) {
    const project_id = project.id

    const userProject = (
      (await app.service('users-projects').find({
        query: {
          user_id,
          project_id,
          $select: ['id'],
        },
      })) as Paginated<UserProject>
    ).data

    if (userProject.length > 0) {
      await app
        .service('users-projects')
        .remove(userProject[0].id as unknown as Id, { skipSyncAdminsCommunitiesAndUsersProjects: true } as any)
    }
  }
}

// prettier-ignore
const hooks: HookOptions<AdminsCommunities> = {
  around: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  before: {
    all: [
      iff(isProvider('external'),
        authenticate('jwt')
      )
    ],
    find: [
      iff(isProvider('external'),
        restrictToOwnUserId()
      )
    ],
    get: [
      iff(isProvider('external'),
        disallow()
      )
    ],
    create: [
      iff(isProvider('external'),
        globalHooks.restrictToSuperadmin()
      )
    ],
    update: [
      disallow(),
    ],
    patch: [
      iff(isProvider('external'),
        restrictToOwnUserId(),
      ),
      globalHooks.restrictPatchToFields(['is_first_login']),
    ],
    remove: [
      iff(isProvider('external'),
        disallow()
      )
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      addToUsersProjects(),
    ],
    update: [],
    patch: [],
    remove: [
      removeFromUsersProjects(),
    ],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
}

export default hooks
