import { NotFound } from '@feathersjs/errors'
import { Id, Paginated } from '@feathersjs/feathers'

import { get, pick, set } from 'lodash'

import { Application, HookContext } from '../declarations'
import { RoleEnum, UserProject } from '../models/users-projects.model'
import { User } from '../models/users.model'

const USER_FIELDS_TO_RETURN = ['id', 'first_name', 'last_name']

const USER_FIELDS_COORDINATOR_AND_ABOVE = [
  'email',
  'phone_number',
  'country',
  'area',
  'city',
  'organization_name',
  'organization_type',
  'organization_title',
]

const USER_FIELDS_SELF_ONLY = ['access_level', 'isVerified', 'is_subscribed_to_emails', 'is_superadmin']

const USER_FIELDS_SUPERADMIN_ONLY = ['created_at', 'last_login', 'how_did_you_hear_about_us', 'active_status']

export const limitUserFieldsReturnedHelper = async (
  app: Application,
  path: string,
  requestedUser: User,
  requestingUser: User,
) => {
  if (path === 'authentication') {
    // Return all returnable user fields
    return pick(requestedUser, [
      ...USER_FIELDS_TO_RETURN,
      ...USER_FIELDS_COORDINATOR_AND_ABOVE,
      ...USER_FIELDS_SELF_ONLY,
    ])
  }

  // Check if requesting user is superadmin
  if (requestingUser.is_superadmin) {
    // Return all returnable user fields
    return pick(requestedUser, [
      ...USER_FIELDS_TO_RETURN,
      ...USER_FIELDS_COORDINATOR_AND_ABOVE,
      ...USER_FIELDS_SELF_ONLY,
      ...USER_FIELDS_SUPERADMIN_ONLY,
    ])
  }

  // Check if requesting user is self
  if (requestingUser.id === requestedUser.id) {
    return pick(requestedUser, [
      ...USER_FIELDS_TO_RETURN,
      ...USER_FIELDS_COORDINATOR_AND_ABOVE,
      ...USER_FIELDS_SELF_ONLY,
    ])
  }

  // Check if requesting user is a coordinator or above on a project with requested user
  const projectIdsOfRequestedUser = (
    (await app.service('users-projects').find({
      query: {
        user_id: requestedUser.id,
        $select: ['project_id'],
      },
    })) as Paginated<UserProject>
  ).data.map((up) => up.project_id)

  const projectRolesOfRequestingUser = (
    (await app.service('users-projects').find({
      query: {
        user_id: requestingUser.id,
        project_id: {
          $in: projectIdsOfRequestedUser,
        },
        $select: ['project_role'],
      },
    })) as Paginated<UserProject>
  ).data.map((up) => up.project_role)

  if (projectRolesOfRequestingUser.length === 0) {
    // Requesting user does not share any projects with requested user
    throw new NotFound('User not found')
  }

  if (Math.max(...projectRolesOfRequestingUser) >= RoleEnum.COORDINATOR) {
    // Requesting user is a coordinator or higher
    return pick(requestedUser, [...USER_FIELDS_TO_RETURN, ...USER_FIELDS_COORDINATOR_AND_ABOVE])
  }

  // Requesting user is not a coordinator or higher, but does share projects with requested user
  return pick(requestedUser, USER_FIELDS_TO_RETURN)
}

const limitUserFieldsReturned = (pathToRequestedUser: string) => async (context: HookContext) => {
  const { app, id, params, path } = context
  const requestedUser = get(context, pathToRequestedUser)

  try {
    const returnedFields = await limitUserFieldsReturnedHelper(app, path, requestedUser, params.user)
    set(context, pathToRequestedUser, returnedFields)
  } catch (error) {
    if ((error as any).message === 'User not found') {
      throw new NotFound(`No record found for id '${id}'`)
    } else {
      throw error
    }
  }

  return context
}

export default limitUserFieldsReturned
