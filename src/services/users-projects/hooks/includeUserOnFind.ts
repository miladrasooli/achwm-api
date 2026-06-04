import { get, set } from 'lodash'

import { HookContext } from '../../../declarations'
import { User } from '../../../models/users.model'
import { UserProject } from '../../../models/users-projects.model'
import { limitUserFieldsForProjectCollaborators } from '../../../hooks/limitUserFieldsReturned'

const getFindResults = <T>(result: unknown): T[] => {
  if (Array.isArray(result)) {
    return result as T[]
  }

  return get(result, 'data', []) as T[]
}

const setFindResults = (context: HookContext, data: unknown[]) => {
  if (Array.isArray(context.result)) {
    context.result = data
  } else {
    set(context, 'result.data', data)
  }
}

export const extractIncludeUserQuery = () => async (context: HookContext) => {
  const { params } = context

  if (params.query?.includeUser) {
    params.includeUser = true
    delete params.query.includeUser

    if (!params.query.$limit) {
      params.query.$limit = 50
    }
  }

  return context
}

export const includeUserOnFind = () => async (context: HookContext) => {
  const { app, params, result } = context

  if (!params.includeUser) {
    return context
  }

  const userProjects = getFindResults<UserProject>(result)
  const userIds = [...new Set(userProjects.map((userProject) => userProject.user_id))]

  if (userIds.length === 0) {
    setFindResults(context, [])
    return context
  }

  const users = getFindResults<User>(
    await app.service('users').find({
      paginate: false,
      query: {
        id: {
          $in: userIds,
        },
      },
    }),
  )

  const usersById = new Map(users.map((user) => [user.id, user]))
  const requestingUserProjectRole = params.user?.id
    ? userProjects.find((userProject) => userProject.user_id === params.user.id)?.project_role
    : undefined
  const collaboratorUsers = []

  for (const userProject of userProjects) {
    const user = usersById.get(userProject.user_id)

    if (!user) {
      continue
    }

    const limitedUser = limitUserFieldsForProjectCollaborators(user, params.user, requestingUserProjectRole)
    collaboratorUsers.push({ ...userProject, user: limitedUser })
  }

  setFindResults(context, collaboratorUsers)

  return context
}
