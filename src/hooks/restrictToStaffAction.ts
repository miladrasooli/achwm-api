import { Forbidden } from '@feathersjs/errors'
import { Paginated } from '@feathersjs/feathers'

import { HookContext } from '../declarations'
import { StaffActionKey, hasStaffAction } from '../staff-actions'

export const userHasStaffAction = async (context: HookContext, action: StaffActionKey, userId?: string) => {
  const { app, params } = context
  const checkedUserId = userId || params.user?.id

  if (!checkedUserId) {
    return false
  }

  if (!userId && hasStaffAction(params.user, action)) {
    return true
  }

  const staffActions = (await app.service('staff-actions').find({
    query: {
      key: action,
      $limit: 1,
    },
    paginate: false,
    provider: undefined,
  } as any)) as any[]

  const staffAction = staffActions[0]

  if (!staffAction) {
    return false
  }

  const permissions = (await app.service('staff-action-permissions').find({
    query: {
      user_id: checkedUserId,
      action_id: staffAction.id,
      $limit: 0,
    },
    provider: undefined,
  } as any)) as Paginated<any>

  return permissions.total > 0
}

export const userHasAnyStaffAction = async (context: HookContext, userId?: string) => {
  const { app, params } = context
  const checkedUserId = userId || params.user?.id

  if (!checkedUserId) {
    return false
  }

  if (!userId && params.user?.staff_actions && params.user.staff_actions.length > 0) {
    return true
  }

  const permissions = (await app.service('staff-action-permissions').find({
    query: {
      user_id: checkedUserId,
      $limit: 0,
    },
    provider: undefined,
  } as any)) as Paginated<any>

  return permissions.total > 0
}

const restrictToStaffAction = (action: StaffActionKey) => async (context: HookContext) => {
  if (!(await userHasStaffAction(context, action))) {
    throw new Forbidden('User does not have permission')
  }

  return context
}

export const restrictToAnyStaffAction = () => async (context: HookContext) => {
  if (!(await userHasAnyStaffAction(context))) {
    throw new Forbidden('User does not have permission')
  }

  return context
}

export default restrictToStaffAction
