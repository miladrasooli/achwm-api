import { get, set } from 'lodash'

import { HookContext } from '../declarations'

const loadStaffActionsForUser = async (context: HookContext, userId: string) => {
  const permissions = (await context.app.service('staff-action-permissions').find({
    query: {
      user_id: userId,
    },
    paginate: false,
    provider: undefined,
  } as any)) as any[]

  if (permissions.length === 0) {
    return []
  }

  const actions = (await context.app.service('staff-actions').find({
    query: {
      id: {
        $in: permissions.map((permission) => permission.action_id),
      },
      $select: ['key'],
    },
    paginate: false,
    provider: undefined,
  } as any)) as any[]

  return actions.map((action) => action.key)
}

const loadStaffActions = (pathToUser: string) => async (context: HookContext) => {
  const user = get(context, pathToUser)

  if (!user?.id) {
    return context
  }

  set(context, `${pathToUser}.staff_actions`, await loadStaffActionsForUser(context, user.id))

  return context
}

export default loadStaffActions
