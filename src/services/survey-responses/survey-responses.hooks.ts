import { uniq } from 'lodash'

import { Forbidden } from '@feathersjs/errors'
import * as feathersAuthentication from '@feathersjs/authentication'
const { authenticate } = feathersAuthentication.hooks
import { iff, isProvider } from 'feathers-hooks-common'
import { isVerified } from 'feathers-authentication-management'

import { HookContext, HookOptions } from '../../declarations'
import { SurveyResponses } from './survey-responses.class'

import globalHooks from '../../hooks'
import { RoleEnum } from '../../models/users-projects.model'

const DISALLOWED_FIELDS = [
  'record_id',
  'participant_id',
  'pronouns',
  'birth_month',
  'birth_year',
  'birth_date',
  'age',
  'school_grade',
  'created_at',
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

const addExtraInformation = () => async (context: HookContext) => {
  const { app, result } = context

  if (Array.isArray(result)) {
    // Add dataset_name
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

    // Add names of relevant users
    const userIds = uniq(result.flatMap((r) => [r.follow_up_recommendation_by, r.started_by]))
    const userIdToUserName: { [key: string]: string } = {}
    for (const userId of userIds) {
      if (!userId) {
        continue
      }
      const user = await app.service('users').get(userId)
      userIdToUserName[userId] = `${user.first_name} ${user.last_name}`
    }

    for (const response of result) {
      if (response.follow_up_recommendation_by) {
        response.follow_up_recommendation_by_name = userIdToUserName[response.follow_up_recommendation_by]
      }
      if (response.started_by) {
        response.started_by_name = userIdToUserName[response.started_by]
      }
    }
  } else {
    // Add dataset_name
    result.dataset_name = (await app.service('datasets').get(result.dataset_id)).name

    // Add names of relevant users
    if (result.follow_up_recommendation_by) {
      const followUpRecommendationUser = await app.service('users').get(result.follow_up_recommendation_by)
      result.follow_up_recommendation_by_name = `${followUpRecommendationUser.first_name} ${followUpRecommendationUser.last_name}`
    }

    if (result.started_by) {
      const startedByUser = await app.service('users').get(result.started_by)
      result.started_by_name = `${startedByUser.first_name} ${startedByUser.last_name}`
    }
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

const addFollowUpRecommendationBy = () => (context: HookContext) => {
  const { data, params } = context

  // If there is no follow_up_recommendation, remove follow_up_recommendation_by
  if (!data.follow_up_recommendation) {
    data.follow_up_recommendation_by = null
  } else {
    // If there is a follow_up_recommendation, set follow_up_recommendation_by to current user
    data.follow_up_recommendation_by = params.user.id
  }

  return context
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
      addFollowUpRecommendationBy()
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
        addExtraInformation(),
        //calculateSurveyResultsIfNeeded() TODO: Reimplement
      )
    ],
    get: [
      iff(isProvider('external'),
        addExtraInformation(),
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
