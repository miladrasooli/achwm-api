import { get } from 'lodash'
import { HookContext } from '../declarations'
import { ROLE_NAMES, RoleEnum } from '../models/users-projects.model'

/*
This hook logs the following events as milestones, 
which are displayed in the superadmin Manage Communities table:

- Project creation
- Project patches
- Survey response creation
- Community creation
- Community status change
- Dataset creation
- Dataset deletion
- User-project creation
- User-project patch
- User-project deletion
*/
const milestoneLogger = () => async (context: HookContext) => {
  const { app, method, params, path, priorValues, result } = context
  const transaction = get(params, 'sequelize.transaction')

  const service = app.service('milestones')
  const actor = params.user ? (params.user.is_superadmin ? 'Superadmin' : 'User') : 'System'

  if (path === 'projects') {
    if (method === 'create') {
      // Project creation
      await service.create({
        community_id: result.community_id,
        project_id: result.id,
        message: `${actor} created a project`,
      })
    } else if (method === 'patch') {
      // Project patch
      await service.create(
        {
          community_id: result.community_id,
          project_id: result.id,
          message: `${actor} updated a project`,
        },
        { sequelize: { transaction } },
      )
    }
  } else if (path === 'survey-responses') {
    if (method === 'create') {
      // Survey response creation
      const project = await app.service('projects').get(result.project_id)
      await service.create({
        community_id: project.community_id,
        project_id: project.id,
        message: `${actor} uploaded a survey response`,
      })
    }
  } else if (path === 'communities') {
    // Community creation
    if (method === 'create') {
      await service.create({
        community_id: result.id,
        message: `${actor} created the community`,
      })
    } else if (method === 'patch') {
      if (priorValues.status !== result.status) {
        // Community status change
        await service.create({
          community_id: result.id,
          message: `${actor} changed community status from ${priorValues.status} to ${result.status}`,
        })
      }
    }
  } else if (path === 'datasets') {
    if (method === 'create') {
      // Dataset creation
      const project = await app.service('projects').get(result.project_id, { sequelize: { transaction } })
      await service.create(
        {
          community_id: project.community_id,
          project_id: project.id,
          message: `${actor} created dataset`,
        },
        { sequelize: { transaction } },
      )
    } else if (method === 'remove') {
      // Dataset deletion
      const project = await app.service('projects').get(result.project_id)
      await service.create({
        community_id: project.community_id,
        project_id: project.id,
        message: `${actor} deleted dataset`,
      })
    }
  } else if (path === 'users-projects') {
    if (method === 'create') {
      // Add member to project
      const project = await app.service('projects').get(result.project_id, { sequelize: { transaction } })
      await service.create(
        {
          community_id: project.community_id,
          project_id: project.id,
          message: `${actor} added ${ROLE_NAMES[result.project_role as RoleEnum]} to project`,
        },
        { sequelize: { transaction } },
      )
    } else if (method === 'patch') {
      if (priorValues.project_role !== result.project_role) {
        // Change member role on project
        const project = await app.service('projects').get(result.project_id)
        await service.create({
          community_id: project.community_id,
          project_id: project.id,
          message: `${actor} changed a ${ROLE_NAMES[priorValues.project_role as RoleEnum]} to a ${
            ROLE_NAMES[result.project_role as RoleEnum]
          } on a project`,
        })
      }
    } else if (method === 'remove') {
      // Remove member from project
      const project = await app.service('projects').get(result.project_id)
      await service.create({
        community_id: project.community_id,
        project_id: project.id,
        message: `${actor} removed a ${ROLE_NAMES[result.project_role as RoleEnum]} from a project`,
      })
    }
  }

  return context
}

export default milestoneLogger
