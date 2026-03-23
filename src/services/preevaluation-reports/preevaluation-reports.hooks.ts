import { iff, isProvider } from 'feathers-hooks-common'
import { authenticate } from '@feathersjs/authentication'

import { HookOptions } from '../../declarations'
import { PreevaluationReports } from './preevaluation-reports.class'
import { RoleEnum } from '../../models/users-projects.model'

import restrictToOwnProjects from '../../hooks/restrictToOwnProjects'

// prettier-ignore
const hooks: HookOptions<PreevaluationReports> = {
  around: {
    all: [],
    create: [],
  },

  before: {
    all: [
      iff(isProvider('external'),
        authenticate('jwt'),
        restrictToOwnProjects({minimumRole: RoleEnum.COORDINATOR}) as any
      )
    ],
    create: [],
  },

  after: {
    all: [],
    create: [],
  },

  error: {
    all: [],
    create: [],
  },
}

export default hooks
