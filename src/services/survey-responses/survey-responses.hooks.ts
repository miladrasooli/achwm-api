import dayjs from 'dayjs'
import { uniq } from 'lodash'

import { Forbidden } from '@feathersjs/errors'
import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { disallow, iff, isProvider } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookContext, HookOptions } from '../../declarations'
import { SurveyResponses, SurveyStatusEnum } from './survey-responses.class'

import globalHooks from '../../hooks'
import calculateSurveyResults from './calculateSurveyResults'
import { RoleEnum } from '../../models/users-projects.model'

const DISALLOWED_FIELDS = [
  'record_id',
  'participant_id',
  'pronouns',
  'location',
  'birth_month',
  'birth_year',
  'created_at',
  'dataset_id',
]

/*
TODO: Reimplement
const calculateSurveyResultsIfNeeded = () => async (context: HookContext) => {
  const { app, method, service, result } = context

  let surveyResponses
  if (method === 'find') {
    surveyResponses = result.data
  } else if (method === 'get') {
    surveyResponses = [result]
  }

  for (const [index, surveyResponse] of surveyResponses.entries()) {
    // Calculate survey results if results have not been calculated
    // and survey was started over a day ago
    if (
      surveyResponse.status === SurveyStatusEnum.IN_PROGRESS &&
      dayjs().subtract(1, 'day').isAfter(surveyResponse.created_at)
    ) {
      const newResults = await calculateSurveyResults(app, surveyResponse)
      const newSurveyResponse = await service.patch(surveyResponse.id, newResults)
      surveyResponses[index] = newSurveyResponse
    }
  }

  if (method === 'find') {
    result.data = surveyResponses
  } else if (method === 'get') {
    context.result = surveyResponses[0]
  }

  return context
}
  */

const appendDatasetName = () => async (context: HookContext) => {
  const { app, result } = context

  if (Array.isArray(result)) {
    const datasetIds = uniq(result.map((r) => r.dataset_id))
    const datasetIdToDatasetName: { [key: string]: string } = {}
    for (const datasetId of datasetIds) {
      if (!datasetId) {
        continue
      }
      const datasetName = (await app.service('datasets').get(datasetId)).name
      datasetIdToDatasetName[datasetId] = datasetName
    }

    for (const response of result) {
      response.dataset_name = datasetIdToDatasetName[response.dataset_id]
    }
  } else {
    result.dataset_name = (await app.service('datasets').get(result.dataset_id)).name
  }

  return context
}

const preventPatchingFields = () => (context: HookContext) => {
  const { data } = context

  for (const field of Object.keys(data)) {
    if (DISALLOWED_FIELDS.includes(field)) {
      throw new Forbidden(`"${field}" field can not be patched`)
    }
  }
}

// prettier-ignore
const hooks: HookOptions<SurveyResponses> = {
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
        isVerified(),
      ),
    ],
    find: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjectsForRedcapServices()
      ),
    ],
    get: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjectsForRedcapServices()
      ),
    ],
    create: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjectsForRedcapServices()
      ),
    ],
    patch: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjectsForRedcapServices()
      ),
      preventPatchingFields(),
    ],
    remove: [
      iff(isProvider('external'),
        globalHooks.restrictToOwnProjectsForRedcapServices(RoleEnum.ADMIN)
      ),
    ],
  },

  after: {
    all: [],
    find: [
      iff(isProvider('external'),
        appendDatasetName(),
        //calculateSurveyResultsIfNeeded() TODO: Reimplement
      )
    ],
    get: [
      iff(isProvider('external'),
        appendDatasetName(),
        //calculateSurveyResultsIfNeeded() TODO: Reimplement
      )
    ],
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
