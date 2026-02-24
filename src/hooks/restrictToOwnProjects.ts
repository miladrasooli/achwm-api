import { get, intersection } from 'lodash'

import { Paginated } from '@feathersjs/feathers'
import { BadRequest, NotFound } from '@feathersjs/errors'

import { HookContext } from '../declarations'
import { RoleEnum, UserProject } from '../models/users-projects.model'

const restrictToOwnProjects =
  (options: { projectIdField?: string; minimumRole?: RoleEnum } = {}) =>
  async (context: HookContext) => {
    const { projectIdField = 'project_id', minimumRole } = options
    const { app, data, id, method, params, service } = context

    // Don't restrict superadmins
    if (get(params, 'user.is_superadmin')) {
      return context
    }

    if (method === 'find') {
      return restrictFindToOwnProjects(projectIdField, minimumRole)(context)
    }

    // Get user ID
    const userId: string = get(params, 'user.id')

    // Get project ID
    let projectId: string

    if (['get', 'patch', 'remove'].includes(method)) {
      projectId = (await service.get(id))[projectIdField]
    } else {
      projectId = data[projectIdField]
    }

    // Get user project
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
      if (method === 'create') {
        throw new BadRequest(`No record found for ${projectIdField}: ${projectId}`)
      } else {
        throw new NotFound(`No record found for id '${id}'`)
      }
    }

    return context
  }

const restrictFindToOwnProjects = (projectIdField?: string, minimumRole?: RoleEnum) => async (context: HookContext) => {
  const { app, params } = context
  const { query = {} } = params

  if (!projectIdField) {
    projectIdField = 'project_id'
  }

  // Get user ID
  const userId: string = get(context, 'params.user.id')

  // Get allowed project IDs
  const usersProjectsQuery: { user_id: string; $select: string[]; project_role?: Object } = {
    user_id: userId,
    $select: [projectIdField],
  }

  if (minimumRole) {
    usersProjectsQuery.project_role = {
      $gte: minimumRole,
    }
  }

  const allowedProjectIds: string[] = (
    await app.service('users-projects').find({
      query: usersProjectsQuery,
      paginate: false,
    })
  ).map((up) => up.project_id)

  // Restrict query to allowed project IDs
  if (!query[projectIdField]) {
    query[projectIdField] = {
      $in: allowedProjectIds,
    }
  } else if (query[projectIdField].$in) {
    query[projectIdField] = {
      $in: intersection(query[projectIdField].$in, allowedProjectIds),
    }
  } else {
    if (!allowedProjectIds.includes(query[projectIdField])) {
      query[projectIdField] = null
    }
  }

  return context
}

export default restrictToOwnProjects
