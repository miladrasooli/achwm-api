import { get } from 'lodash'

import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { Paginated } from '@feathersjs/feathers'
import { BadRequest, Forbidden } from '@feathersjs/errors'
import { disallow, iff, isProvider, validate, ValidatorFn } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookContext, HookOptions } from '../../declarations'
import { Projects } from './projects.class'
import { AdminCommunity } from '../../models/admins-communities.model'
import { RoleEnum, UserProject } from '../../models/users-projects.model'

import globalHooks from '../../hooks'
import { ProjectStatusEnum } from '../../models/projects.model'
import { RedcapActionEnum } from '../redcap/redcap.class'
import { StaffActionKey } from '../../staff-actions'
import { userHasStaffAction } from '../../hooks/restrictToStaffAction'

// When a user creates a project, add the necessary user/project pairs to users-projects table
const createUserProjects = () => async (context: HookContext) => {
  const { app, data, params, result } = context
  const { transaction, user } = params

  if (!transaction) {
    throw new Error('No transaction found in context.params')
  }

  const { pin } = data
  const { community_id, id } = result
  const userId = get(user, 'id')

  // Get admins for this community
  const admins = (
    (await app.service('admins-communities').find({
      query: {
        community_id,
      },
    })) as Paginated<AdminCommunity>
  ).data

  // Add community's admins as admins for this project
  await Promise.all(
    admins.map((admin) => {
      const userProject: Partial<UserProject> = {
        user_id: admin.user_id,
        project_id: id,
        project_role: RoleEnum.ADMIN,
      }

      if (admin.user_id === userId && pin) {
        userProject.project_pin = pin
      }

      return app
        .service('users-projects')
        .create(userProject, { skipSyncAdminsCommunitiesAndUsersProjects: true, sequelize: { transaction } } as any)
    }),
  )

  return context
}

const projectValidator: ValidatorFn = async (formValues, context) => {
  const { app, method, priorValues } = context
  let { purpose, community_id, redcap_template_id, redcap_token } = formValues

  // Validate that project has at least one purpose
  if (purpose) {
    if (purpose.length === 0) {
      throw new BadRequest('Projects must have at least one purpose')
    }
  }

  if (method === 'create') {
    // Validate that redcap_template_id matches community_id
    const redcapTemplate = await app.service('redcap-templates').get(redcap_template_id)
    const community = await app.service('communities').get(community_id)
    if (redcapTemplate.redcap_server_id !== community.redcap_server_id) {
      throw new BadRequest('Community ID and REDCap Template ID are not associated with the same REDCap server')
    }
  }

  // redcap_token can only be patched from no value to a value
  if (method === 'patch') {
    if (priorValues.redcap_token && redcap_token !== undefined) {
      throw new Forbidden('"redcap_token" field can not be patched')
    }

    if (formValues.status === ProjectStatusEnum.ARCHIVED && !context.params?.fromArchiveAction) {
      throw new BadRequest('Use the archive action to archive a project')
    }
  }

  return null
}

// When a user creates a project, create its first dataset
const createDataset = () => async (context: HookContext) => {
  const { app, data, params, result } = context
  const { transaction } = params

  if (!transaction) {
    throw new Error('No transaction found in context.params')
  }

  const { dataset_name } = data

  if (!dataset_name) {
    return context
  }

  await app.service('datasets').create(
    {
      name: dataset_name,
      project_id: result.id,
    },
    { sequelize: { transaction } },
  )

  return context
}

// When a user creates a project, create a REDCap project
const createRedcapProject = () => async (context: HookContext) => {
  const { app, params, result, service } = context
  const { transaction } = params

  if (!transaction) {
    throw new Error('No transaction found in context.params')
  }

  const { id, name, community_id, redcap_template_id } = result
  const newToken = await app.service('redcap').create({
    action: RedcapActionEnum.CREATE_PROJECT,
    params: { name, community_id, redcap_template_id },
  })

  await service.patch(id, { redcap_token: newToken }, { sequelize: { transaction } })

  return context
}

const restrictToAdmins = () => async (context: HookContext) => {
  const { app, data, params } = context

  const userId = get(params, 'user.id')
  const communityId = get(data, 'community_id')

  const isAdmin = (
    (await app.service('admins-communities').find({
      query: {
        user_id: userId,
        community_id: communityId,
        $limit: 0,
      },
    })) as Paginated<AdminCommunity>
  ).total

  if (!isAdmin) {
    throw new Forbidden('User has insufficient permissions')
  }

  return context
}

const restrictToStaffActionOrOwnProject =
  (action: StaffActionKey, ownProjectOptions: { projectIdField?: string; minimumRole?: RoleEnum } = {}) =>
  async (context: HookContext) => {
    if (context.params?.fromArchiveAction) {
      return context
    }

    if (await userHasStaffAction(context, action)) {
      return context
    }

    return globalHooks.restrictToOwnProjects(ownProjectOptions)(context)
  }

// prettier-ignore
const hooks: HookOptions<Projects> = {
  around: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
    archive: [],
    deleteProject: [],
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
        globalHooks.restrictToStaffAction(StaffActionKey.VIEW_PROJECTS)
      ),
    ],
    get: [
      iff(isProvider('external'),
        restrictToStaffActionOrOwnProject(StaffActionKey.VIEW_PROJECTS, {projectIdField: 'id'}),
      ),
    ],
    create: [
      globalHooks.beginTransaction(),
      iff(isProvider('external'),
        restrictToAdmins()
      ),
      validate(projectValidator),
    ],
    update: [
      disallow(),
    ],
    patch: [
      iff(isProvider('external'),
        restrictToStaffActionOrOwnProject(StaffActionKey.EDIT_PROJECTS, {projectIdField: 'id', minimumRole: RoleEnum.ADMIN})
      ),
      globalHooks.restrictPatchToFields(['name', 'description', 'purpose', 'number_of_participants', 'status', 'redcap_token']),
      validate(projectValidator)
    ],
    remove: [
      iff(isProvider('external'),
        disallow(),
      ),
    ],
    archive: [
      iff(isProvider('external'),
        authenticate('jwt'),
        isVerified(),
        globalHooks.restrictToStaffAction(StaffActionKey.ARCHIVE_PROJECTS) as any,
      ),
    ],
    deleteProject: [
      iff(isProvider('external'),
        authenticate('jwt'),
        isVerified(),
        globalHooks.restrictToStaffAction(StaffActionKey.DELETE_PROJECTS) as any,
      ),
      globalHooks.beginTransaction(),
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      createUserProjects(),
      createDataset(),
      createRedcapProject(),
      globalHooks.commitTransaction()
    ],
    update: [],
    patch: [],
    remove: [],
    archive: [],
    deleteProject: [
      globalHooks.commitTransaction(),
    ],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [
      globalHooks.rollbackTransaction()
    ],
    update: [],
    patch: [],
    remove: [],
    archive: [],
    deleteProject: [
      globalHooks.rollbackTransaction(),
    ],
  },
}

export default hooks
