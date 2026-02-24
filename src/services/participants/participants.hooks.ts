import { BadRequest } from '@feathersjs/errors'
import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { disallow, iff, isProvider, validate, ValidatorFn } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookOptions } from '../../declarations'
import { Participants } from './participants.class'
import { RoleEnum } from '../../models/users-projects.model'

import globalHooks from '../../hooks'

const participantValidator: ValidatorFn = (formValues, _) => {
  const { participant_id } = formValues

  if (participant_id !== undefined) {
    if (!/^\d*$/.test(participant_id)) {
      throw new BadRequest('participant_id field can only contain digits')
    }
  }

  return null
}

// prettier-ignore
const hooks: HookOptions<Participants> = {
  around: {
    all: [],
    find: [],
    get: [],
    create: [],
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
        globalHooks.restrictToOwnProjectsForRedcapServices(),
      ),
    ],
    get: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjectsForRedcapServices(),
      )
    ],
    create: [
      iff(isProvider('external'),
        disallow(),
      ),
      validate(participantValidator),
    ],
    patch: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjectsForRedcapServices(RoleEnum.COORDINATOR),
      ),
      validate(participantValidator),
      globalHooks.restrictPatchToFields([
        'participant_id', 
        'birth_month', 
        'birth_year', 
        'pronouns', 
        'survey_preferences'
      ])
    ],
    remove: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjectsForRedcapServices(),
      ),
    ],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    patch: [],
    remove: [],
  },
}

export default hooks
