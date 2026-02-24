import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { disallow, iff, isProvider, validate, ValidatorFn } from 'feathers-hooks-common'
import { Paginated } from '@feathersjs/feathers'
import { BadRequest, Forbidden } from '@feathersjs/errors'
import { isVerified } from 'feathers-authentication-management'

import { get, isFinite, toNumber } from 'lodash'

import { HookContext, HookOptions } from '../../declarations'
import { Invitations } from './invitations.class'
import { ROLE_NAMES, RoleEnum, UserProject } from '../../models/users-projects.model'
import { EmailTypeEnum } from '../../models/emails.model'
import { Invitation } from '../../models/invitations.model'

import globalHooks from '../../hooks'

const APP_BASE_URL = process.env.APP_BASE_URL

const returnAllInvitationsForProject = () => async (context: HookContext) => {
  const { app, params } = context
  const { query, user } = params
  const { project_id } = query

  if (!project_id) {
    throw new BadRequest('"project_id" must be provided to find invitations.')
  }

  // Check that user has access to this project and is coordinator or above
  let hasAccess
  if (user.is_superadmin) {
    hasAccess = true
  } else {
    hasAccess = (
      (await app.service('users-projects').find({
        query: {
          user_id: user.id,
          project_id,
          project_role: {
            $gte: RoleEnum.COORDINATOR,
          },
          $limit: 0,
        },
      })) as Paginated<UserProject>
    ).total
  }

  if (!hasAccess) {
    // Provide query that will not return anything
    params.query = { project_id: null }
    return context
  }

  // Build query that will return all invitees for this project
  const communityId = (await app.service('projects').get(project_id)).community_id

  params.query = {
    $or: [
      {
        community_id: communityId,
        project_role: {
          $gte: RoleEnum.ADMIN,
        },
      },
      { project_id },
    ],
    accepted_at: null,
  }

  return context
}

const addUserAndCommunityId = () => async (context: HookContext) => {
  const { app, data, params } = context

  data.community_id = (await app.service('projects').get(data.project_id)).community_id
  data.invited_by = get(params, 'user.id')

  return context
}

const invitationsValidator: ValidatorFn = async (formValues, context) => {
  const { app, id, method, service } = context

  if (formValues.project_role) {
    // Make sure new project role is within range
    if (!RoleEnum[formValues.project_role]) {
      const validProjectRoles = Object.keys(RoleEnum).filter((k) => isFinite(toNumber(k)))
      console.error(
        `Invalid project_role value: ${
          formValues.project_role
        }. Projects roles must be one of: ${validProjectRoles.join(', ')}.`,
      )
      throw new BadRequest(`Invalid patch values`)
    }
  }

  let proposedInvitation
  if (method === 'create') {
    proposedInvitation = formValues
  } else if (method === 'patch') {
    const existingInvitation = await service.get(id)
    proposedInvitation = { ...existingInvitation, ...formValues }
  }

  const { email, community_id, project_id, project_role } = proposedInvitation

  // Check for duplicate invitations
  const otherInvitationsForSameUserAndCommunity = (
    await service.find({
      query: {
        ...(id !== undefined ? { id: { $ne: id } } : {}),
        email,
        community_id,
        accepted_at: null,
      },
    })
  ).data

  // Check if other invitations are for the same project
  const otherInvitaitonsForSameProject = otherInvitationsForSameUserAndCommunity.filter(
    (invite: Invitation) => invite.project_id === project_id,
  )

  if (otherInvitaitonsForSameProject.length > 0) {
    throw new BadRequest('User has already been invited to this project')
  }

  if (project_role >= RoleEnum.ADMIN) {
    // If other invitations aren't for the same project, remove other invitations so they can be replaced with the new one
    await Promise.all(otherInvitationsForSameUserAndCommunity.map((invite: Invitation) => service.remove(invite.id)))
  }

  // Check if invitee is already a collaborator
  const userData = (
    await app.service('users').find({
      query: {
        email,
      },
    })
  ).data

  if (userData.length > 0) {
    const userId = userData[0].id

    const numUserProjects = (
      await app.service('users-projects').find({
        query: {
          user_id: userId,
          project_id,
          $limit: 0,
        },
      })
    ).total

    if (numUserProjects > 0) {
      throw new BadRequest('User is already collaborator for this project')
    }
  }

  return null
}

const preventPatchingAcceptedInvitations = () => async (context: HookContext) => {
  const { id, service } = context

  const existingInvitation = await service.get(id)
  if (existingInvitation.accepted_at) {
    throw new Forbidden('This invitation has already been accepted and can no longer be patched.')
  }

  return context
}

const sendInvitationEmail = () => async (context: HookContext) => {
  const { app, data, method, result } = context
  const { id, email, community_id, project_role, project_id } = result

  if (method === 'patch') {
    // Check that new invitation email should be sent
    if (!data.project_role) {
      return context
    }
  }

  if (project_role >= RoleEnum.ADMIN) {
    const communityName = (await app.service('communities').get(community_id)).name

    await app.service('emails').create({
      email,
      type: EmailTypeEnum.INVITE_ADMIN,
      communityName: communityName,
      actionUrl: `${APP_BASE_URL}/login/?token=${id}`,
    })

    return context
  }

  const project = await app.service('projects').get(project_id)

  await app.service('emails').create({
    email,
    type: EmailTypeEnum.INVITE_COLLABORATOR,
    projectName: project.name,
    projectRole: ROLE_NAMES[project_role as RoleEnum],
    actionUrl: `${APP_BASE_URL}/login/?token=${id}`,
  })

  return context
}

const acceptInvitation = () => async (context: HookContext) => {
  const { app, id, data, params, service } = context
  const { accepted_at } = data

  // Check if user matches invitation
  const invitation = await service.get(id)
  const { user } = params

  if (invitation.email !== user.email) {
    throw new Forbidden('This invitation cannot be accepted by this user')
  }

  // Accept invitation
  const { community_id, project_role, project_id } = invitation

  if (project_role >= RoleEnum.ADMIN) {
    // Add user to admins-communities db
    // Admins-communities hooks will make the user an admin for all projects in the community
    await app.service('admins-communities').create({ user_id: user.id, community_id })
  } else {
    // Add user to users-projects db
    await app.service('users-projects').create({ user_id: user.id, project_id, project_role })
  }

  // Verify user if user is not already verified
  if (!user.isVerified) {
    await app.service('users').patch(user.id, {
      isVerified: true,
    })
  }

  // Add user's ID to patch, and strip other fields
  context.data = {
    accepted_at,
    invited_user_id: user.id,
  }

  return context
}

const handlePatchingProjectRole = () => async (context: HookContext) => {
  const { app, data, id, params, service } = context
  const { user } = params

  const newProjectRole = data.project_role

  if (!user.is_superadmin) {
    // Make sure new project role isn't higher than user's project role
    const userId = user.id
    const projectId = (await service.get(id)).project_id

    // Assume that user project exists since this comes after restrictToOwnProjects hook
    const userProjectRole = (
      (await app.service('users-projects').find({
        query: {
          user_id: userId,
          project_id: projectId,
        },
      })) as Paginated<UserProject>
    ).data[0].project_role

    if (newProjectRole > userProjectRole) {
      throw new Forbidden(`User does not have sufficient permissions to patch project_role to ${newProjectRole}`)
    }
  }

  // Handle switching from admin role
  const oldProjectRole = (await service.get(id)).project_role
  if (oldProjectRole >= RoleEnum.ADMIN && newProjectRole < RoleEnum.ADMIN) {
    if (!data.project_id) {
      throw new BadRequest(`'project_id' must be provided to patch 'project_role' to ${newProjectRole}`)
    }
  }

  return context
}

// prettier-ignore
const hooks: HookOptions<Invitations> = {
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
        isVerified(),
        returnAllInvitationsForProject()
      )
    ],
    get: [
      iff(isProvider('external'),
        disallow()
      )    
    ],
    create: [
      iff(isProvider('external'),
        isVerified(),
        globalHooks.restrictToOwnProjects({minimumRole: RoleEnum.COORDINATOR})
      ),
      addUserAndCommunityId(),
      validate(invitationsValidator),
    ],
    update: [
      disallow()
    ],
    patch: [
      globalHooks.restrictPatchToFields(['project_role', 'accepted_at', 'project_id']),
      preventPatchingAcceptedInvitations(),
      validate(invitationsValidator),
      iff(isProvider('external'),
        iff(context => context.data.accepted_at,
          acceptInvitation()
        ).else(
          isVerified(),
          globalHooks.restrictToOwnProjects({minimumRole: RoleEnum.COORDINATOR}),
          handlePatchingProjectRole()
        ),
      ),
    ],
    remove: [
      iff(isProvider('external'),
        isVerified(),
        globalHooks.restrictToOwnProjects({minimumRole: RoleEnum.COORDINATOR})
      )
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      sendInvitationEmail()
    ],
    update: [],
    patch: [
      sendInvitationEmail()
    ],
    remove: [],
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
