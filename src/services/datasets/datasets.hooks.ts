import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { disallow, iff, isProvider } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookContext, HookOptions } from '../../declarations'
import { Datasets } from './datasets.class'

import { RoleEnum } from '../../models/users-projects.model'
import { StaffActionKey } from '../../staff-actions'
import { userHasStaffAction } from '../../hooks/restrictToStaffAction'

import globalHooks from '../../hooks'

const restrictToStaffActionOrOwnProject =
  (action: StaffActionKey, minimumRole?: RoleEnum) => async (context: HookContext) => {
    if (await userHasStaffAction(context, action)) {
      return context
    }

    return globalHooks.restrictToOwnProjects({ minimumRole })(context)
  }

const removeSurveyResponsesInDataset = () => async (context: HookContext) => {
  const { app, id, service } = context

  // Get project ID
  const projectId = (await service.get(id)).project_id

  await app.service('survey-responses').remove(null, {
    query: {
      dataset_id: id as string,
      project_id: projectId,
    },
  })
}

// prettier-ignore
const hooks: HookOptions<Datasets> = {
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
        restrictToStaffActionOrOwnProject(StaffActionKey.VIEW_PROJECTS)
      )
    ],
    get: [
      iff(isProvider('external'),
        disallow()
      )
    ],
    create: [
      iff(isProvider('external'),
        restrictToStaffActionOrOwnProject(StaffActionKey.EDIT_PROJECTS, RoleEnum.ADMIN)
      )
    ],
    update: [
      disallow(),
    ],
    patch: [
      iff(isProvider('external'),
        restrictToStaffActionOrOwnProject(StaffActionKey.EDIT_PROJECTS, RoleEnum.ADMIN)
      ),
      globalHooks.restrictPatchToFields(['name', 'status'])
    ],
    remove: [
      iff(isProvider('external'),
        restrictToStaffActionOrOwnProject(StaffActionKey.EDIT_PROJECTS, RoleEnum.ADMIN)
      ),
      removeSurveyResponsesInDataset()
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
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
