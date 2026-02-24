import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { disallow, iff, isProvider } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookContext, HookOptions } from '../../declarations'
import { Datasets } from './datasets.class'

import { RoleEnum } from '../../models/users-projects.model'

import globalHooks from '../../hooks'

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
        globalHooks.restrictToOwnProjects()
      )
    ],
    get: [
      iff(isProvider('external'),
        disallow()
      )
    ],
    create: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjects({minimumRole: RoleEnum.ADMIN})
      )
    ],
    update: [
      disallow(),
    ],
    patch: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjects({minimumRole: RoleEnum.ADMIN})
      ),
      globalHooks.restrictPatchToFields(['name', 'status'])
    ],
    remove: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjects({minimumRole: RoleEnum.ADMIN})
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
