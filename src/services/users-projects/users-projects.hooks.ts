import { Id, Paginated } from '@feathersjs/feathers'
import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { disallow, iff, isProvider, validate, ValidatorFn } from 'feathers-hooks-common'
import { BadRequest, Forbidden } from '@feathersjs/errors'
import { checkContext } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { get } from 'lodash'

import { HookContext, HookOptions } from '../../declarations'
import { UsersProjects } from './users-projects.class'
import { AdminCommunity } from '../../models/admins-communities.model'
import { Project } from '../../models/projects.model'
import { RoleEnum, UserProject } from '../../models/users-projects.model'

import globalHooks from '../../hooks'

const userProjectValidator: ValidatorFn = async (formValues, context) => {
  const { project_pin } = formValues

  if (project_pin) {
    // Validate that PIN is correctly formed
    if (!/^[A-Za-z][A-Za-z]\d\d\d\d\d\d$/.test(project_pin)) {
      throw new BadRequest('PIN must be two letters followed by a 6-digit number')
    }

    // Validate that PIN has not been used by another user on this project
    const { id, method, service } = context
    let projectId

    if (method === 'create') {
      projectId = formValues.project_id
    } else {
      projectId = (await service.get(id)).project_id
    }

    const numberOfMatchingPins = (
      await service.find({
        query: {
          id: {
            $ne: id,
          },
          project_id: projectId,
          project_pin,
          $limit: 0,
        },
      })
    ).total

    if (numberOfMatchingPins > 0) {
      throw new BadRequest("We're sorry, the pin you provided does not meet our requirements. Please use another pin.")
    }
  }

  return null
}

const restrictToLowerRole = () => async (context: HookContext) => {
  checkContext(context, 'before', ['patch', 'remove'])

  const { id, data, params, service } = context

  const targetUserProject = await service.get(id)

  // Don't restrict superadmins
  if (get(params, 'user.is_superadmin')) {
    return context
  }

  const userRole = (
    await service.find({
      user_id: params.user.id,
      project_id: targetUserProject.project_id,
    })
  ).data[0].project_role

  if (userRole < targetUserProject.project_role || (data && data.project_role && userRole < data.project_role)) {
    throw new Forbidden('User role is not high enough to make this change')
  }

  return context
}

const updateAdminsCommunities = () => async (context: HookContext) => {
  const { app, result, service, params, method } = context
  const { user_id, project_id, project_role } = result

  if (params.skipSyncAdminsCommunitiesAndUsersProjects) {
    return context
  }

  const community_id = (await app.service('projects').get(project_id)).community_id
  const existingAdminCommunity = (
    (await app.service('admins-communities').find({
      query: {
        user_id,
        community_id,
      },
    })) as Paginated<AdminCommunity>
  ).data

  let updateOtherProjects = false

  // Check if user needs to be added or removed from admin-communities table
  if (project_role >= RoleEnum.ADMIN && existingAdminCommunity.length === 0) {
    // Add user to admins-communities table
    await app.service('admins-communities').create(
      {
        user_id,
        community_id,
      },
      { skipSyncAdminsCommunitiesAndUsersProjects: true } as any,
    )
    updateOtherProjects = true
  } else if (existingAdminCommunity.length > 0) {
    if (method === 'remove' || project_role < RoleEnum.ADMIN) {
      // Remove user from admins-communities table
      await app
        .service('admins-communities')
        .remove(
          existingAdminCommunity[0].id as unknown as Id,
          { skipSyncAdminsCommunitiesAndUsersProjects: true } as any,
        )
      updateOtherProjects = true
    }
  }

  if (updateOtherProjects) {
    // Update other projects to same role
    const otherProjects = (
      (await app.service('projects').find({
        query: {
          community_id,
          id: {
            $ne: project_id,
          },
          $select: ['id'],
        },
      })) as Paginated<Project>
    ).data

    for (const project of otherProjects) {
      const otherProjectId = project.id

      const existingUserProject = (
        (await service.find({
          query: {
            user_id,
            project_id: otherProjectId,
          },
        })) as Paginated<UserProject>
      ).data

      if (existingUserProject.length > 0) {
        if (method === 'remove') {
          await service.remove(existingUserProject[0].id, { skipSyncAdminsCommunitiesAndUsersProjects: true })
        } else {
          await service.patch(
            existingUserProject[0].id,
            {
              project_role,
            },
            { skipSyncAdminsCommunitiesAndUsersProjects: true },
          )
        }
      } else if (method !== 'remove') {
        await service.create(
          {
            user_id,
            project_id: otherProjectId,
            project_role,
          },
          { skipSyncAdminsCommunitiesAndUsersProjects: true },
        )
      }
    }
  }

  return context
}

/*
  Cases where this might be needed: A user is a member of Project A, and has an open invitation for Project B in the same community.
  If they are made an admin of Project A, they will also automatically be made an admin for Project B,
  so the open invitation to Project B should be accepted.
*/
const acceptOutstandingInvitations = () => async (context: HookContext) => {
  const { app, priorValues, result } = context
  const { project_id, project_role } = result

  if (project_role < RoleEnum.ADMIN) {
    return context
  }

  if (priorValues.accepted_at || !result.accepted_at) {
    return context
  }

  let communityId
  try {
    // If the project is being created, its transaction may not have been committed to the db yet
    // If this is true, then the project is new and there are no outstanding invitations,
    // so it's safe to return
    communityId = (await app.service('projects').get(project_id)).community_id
  } catch (error) {
    if (get(error, 'name') === 'NotFound') {
      return context
    }

    throw error
  }

  const outstandingInvitations = await app.service('invitations').find({
    query: {
      community_id: communityId,
      accepted_at: null,
    },
    paginate: false,
  })

  const now = new Date()
  await Promise.all(
    outstandingInvitations.map((invite) => app.service('invitations').patch(invite.user_id, { accepted_at: now })),
  )

  return context
}

// prettier-ignore
const hooks: HookOptions<UsersProjects> = {
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
        authenticate('jwt'),
        isVerified()
      ),
    ],
    find: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjects()
      ),
    ],
    get: [
      iff(isProvider('external'),
        disallow()
      )
    ],
    create: [
      iff(isProvider('external'),
        disallow()
      ),
      validate(userProjectValidator),
    ],
    update: [
      disallow(),
    ],
    patch: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjects({minimumRole: RoleEnum.COORDINATOR}),
        globalHooks.restrictPatchToFields(['project_role', 'project_pin']),
        restrictToLowerRole(),
        iff(context => 'project_pin' in context.data,
          globalHooks.restrictToSelf()
        )
      ),      
      validate(userProjectValidator),
    ],
    remove: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjects({minimumRole: RoleEnum.COORDINATOR}),
        restrictToLowerRole()
      ),
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      updateAdminsCommunities(),
    ],
    update: [],
    patch: [
      updateAdminsCommunities(),
      acceptOutstandingInvitations()
    ],
    remove: [
      updateAdminsCommunities(),
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
