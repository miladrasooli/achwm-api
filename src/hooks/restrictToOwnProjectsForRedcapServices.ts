import { get } from 'lodash'

import { BadRequest, NotFound } from '@feathersjs/errors'
import { HookContext, Paginated } from '@feathersjs/feathers'

import { RoleEnum, UserProject } from '../models/users-projects.model'

const restrictToOwnProjectsForRedcapServices = (minimumRole?: RoleEnum) => async (context: HookContext) => {
  const { app, data, id, method, params } = context

  // Don't restrict superadmins
  if (get(params, 'user.is_superadmin')) {
    return context
  }

  // Get project ID
  let projectId
  if (method === 'create') {
    projectId = get(data, 'project_id')
  } else {
    projectId = get(params, 'query.project_id')
  }

  if (!projectId) {
    throw new BadRequest('project_id must be provided')
  }

  // Get user ID
  const userId = get(params, 'user.id')

  // Get user-project
  const userProject: UserProject = get(
    (await app.service('users-projects').find({
      query: {
        user_id: userId,
        project_id: projectId,
      },
    })) as Paginated<UserProject>,
    'data[0]',
  )

  if (!userProject || (minimumRole && userProject.project_role < minimumRole)) {
    if (method === 'find') {
      context.result = []
      return context
    }

    if (method === 'create') {
      throw new NotFound(`No record found for id '${id}'`)
    }

    throw new NotFound(`No record found for project_id '${projectId}'`)
  }

  return context
}

export default restrictToOwnProjectsForRedcapServices
