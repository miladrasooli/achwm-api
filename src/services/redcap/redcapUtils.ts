import axios from 'axios'
import { flatMap, keys, omit, pick, uniq } from 'lodash'

import { BadRequest } from '@feathersjs/errors'
import { Application } from '@feathersjs/express'

export const VERSION_DELIMITER = ' - '
export const OPTION_DELIMITER = '|'
export const OPTION_COMPONENT_DELIMITER = ','
export const FIELD_NOTE_DELIMITER = ','

export const HEADERS = {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
}

export const QUESTION_REGEX = /^q\d{3}$/

export enum Forms {
  METADATA = 'metadata',
  MULTIPLE_CHOICE = 'multiple_choice',
  DESCRIPTIVE_ANSWERS = 'descriptive_answers',
  OUTCOME = 'outcome',
  SETTINGS = 'settings',
}

export enum Metadata {
  UPDATED_AT = 'updated_at',
  PARTICIPANT_UUID = 'participant_uuid',
  PARTICIPANT_ID = 'participant_id',
  BIRTH_MONTH = 'birth_month',
  BIRTH_YEAR = 'birth_year',
  PRONOUNS = 'pronouns',
  DATASET_ID = 'dataset_id',
  LOCATION = 'survey_location',
  PARTICIPANT_CONSENTED = 'participant_consented',
  STATUS = 'status',
  REVIEW_QUESTION_SHOWING = 'review_question_showing',
  CURRENT_QUESTION_INDEX = 'current_question_index',
  SKIPPED_QUESTION_INCIDES = 'skipped_question_indices',
  STARTED_BY = 'started_by',
  FOLLOW_UP_RECOMMENDATION_BY = 'follow_up_recommendation_by',
  SURVEY_PREFERENCES = 'survey_preferences',
  RECORD_ID = 'record_id',
}

export enum Outcome {
  CLINICIAN_ASSESSMENT_RESULT = 'clinician_rating',
  SUMMARY_SCORE = 'summary_score',
  SPIRITUAL_SCORE = 'spiritual_score',
  EMOTIONAL_SCORE = 'emotional_score',
  PHYSICAL_SCORE = 'physical_score',
  MENTAL_SCORE = 'mental_score',
  POTENTIAL_RISK = 'potential_risk',
  FLAGS = 'flags',
}

export enum Settings {
  VERSION = 'version',
  ORDER = 'survey_identifier_order',
}

export const SCORING_CATEGORIES = [
  Outcome.SPIRITUAL_SCORE,
  Outcome.EMOTIONAL_SCORE,
  Outcome.PHYSICAL_SCORE,
  Outcome.MENTAL_SCORE,
]

export enum FlagEnum {
  YELLOW = 'Yellow',
  RED = 'Red',
  SKIPPED = 'Skipped',
}

export const getRedcapCredentials = async (projectId: string, app: Application) => {
  if (!projectId) {
    throw new BadRequest('project_id must be provided')
  }

  // Get REDCap URL and token
  const { redcap_token, community_id } = await app.service('projects').get(projectId)
  const { redcap_server_id } = await app.service('communities').get(community_id)
  const { server_url } = await app.service('redcap-servers').get(redcap_server_id)

  return { url: server_url, token: redcap_token }
}

export const redcapToAchwm = async (record: any, url: string, token: string) => {
  if (Array.isArray(record)) {
    const recordKeys = uniq(flatMap(record, keys))

    const dataDictionary = (
      await axios.post(
        url,
        {
          token,
          content: 'metadata',
          format: 'json',
          fields: recordKeys,
        },
        HEADERS,
      )
    ).data

    return Promise.all(record.map((r) => redcapToAchwmHelper(r, dataDictionary)))
  }

  const dataDictionary = (
    await axios.post(
      url,
      {
        token,
        content: 'metadata',
        format: 'json',
        fields: Object.keys(record),
      },
      HEADERS,
    )
  ).data

  return redcapToAchwmHelper(record, dataDictionary)
}

const redcapToAchwmHelper = (record: any, dataDictionary: any) => {
  for (const entry of dataDictionary) {
    const { field_name, field_type, select_choices_or_calculations, text_validation_type_or_show_slider_number } = entry

    // Translate between integer value and string value of multiple choice questions except survey questions
    if (select_choices_or_calculations && !QUESTION_REGEX.test(field_name)) {
      const optionList = select_choices_or_calculations.split(OPTION_DELIMITER).map((s: string) => s.trim())
      const options = optionList.reduce((acc: any, curr: string) => {
        const [integerValue, stringValue] = curr.split(OPTION_COMPONENT_DELIMITER).map((s: string) => s.trim())
        acc[integerValue] = stringValue
        return acc
      }, {})

      record[field_name] = options[record[field_name]] || ''
    }

    // Translate between integer value and boolean value of true/false questions
    if (field_type === 'truefalse') {
      record[field_name] = record[field_name] > 0 ? true : false
    }

    // Handle number fields
    if (text_validation_type_or_show_slider_number === 'number') {
      if (record[field_name] == null || record[field_name] === '') {
        record[field_name] = null
      } else {
        record[field_name] = Number(record[field_name])
      }
    }
  }

  // Handle current_question_index
  if (record[Metadata.CURRENT_QUESTION_INDEX] != null) {
    record[Metadata.CURRENT_QUESTION_INDEX] = Number(record[Metadata.CURRENT_QUESTION_INDEX])
  }

  // Handle fields that are objects
  if (record[Metadata.SKIPPED_QUESTION_INCIDES]) {
    record[Metadata.SKIPPED_QUESTION_INCIDES] = JSON.parse(record[Metadata.SKIPPED_QUESTION_INCIDES]).map((n: any) =>
      Number(n),
    )
  }
  if (record[Metadata.SURVEY_PREFERENCES]) {
    record[Metadata.SURVEY_PREFERENCES] = JSON.parse(record[Metadata.SURVEY_PREFERENCES])
  }
  if (record[Outcome.FLAGS]) {
    record[Outcome.FLAGS] = JSON.parse(record[Outcome.FLAGS])
  }

  return record
}

export const achwmToRedcap = async (record: any, url: string, token: string) => {
  if (Array.isArray(record)) {
    const recordKeys = uniq(flatMap(record, keys))

    const dataDictionary = (
      await axios.post(
        url,
        {
          token,
          content: 'metadata',
          format: 'json',
          fields: recordKeys,
        },
        HEADERS,
      )
    ).data

    return Promise.all(record.map((r) => achwmToRedcapHelper(r, dataDictionary)))
  }

  const dataDictionary = (
    await axios.post(
      url,
      {
        token,
        content: 'metadata',
        format: 'json',
        fields: Object.keys(record),
      },
      HEADERS,
    )
  ).data

  return achwmToRedcapHelper(record, dataDictionary)
}

const achwmToRedcapHelper = (record: any, dataDictionary: any) => {
  for (const entry of dataDictionary) {
    const { field_name, field_type, select_choices_or_calculations } = entry

    // Handle version
    if (field_name === Settings.VERSION) {
      if (!(typeof record[Settings.VERSION] === 'string' || record[Settings.VERSION] instanceof String)) {
        // Transform version from object into string
        record[Settings.VERSION] = Object.values(record[Settings.VERSION]).join(VERSION_DELIMITER)
      }
    }

    // Translate between integer value and string value of multiple choice questions except survey questions
    if (select_choices_or_calculations && !QUESTION_REGEX.test(field_name)) {
      const optionList = select_choices_or_calculations.split(OPTION_DELIMITER).map((s: string) => s.trim())
      const options = optionList.reduce((acc: any, curr: string) => {
        const [integerValue, stringValue] = curr.split(OPTION_COMPONENT_DELIMITER).map((s: string) => s.trim())
        acc[stringValue] = integerValue
        return acc
      }, {})

      record[field_name] = options[record[field_name]] || ''
    }

    // Translate between integer value and boolean value of true/false questions
    if (field_type === 'truefalse') {
      record[field_name] = record[field_name] ? 1 : 0
    }
  }

  // Handle fields that are objects
  if (record[Metadata.SKIPPED_QUESTION_INCIDES]) {
    record[Metadata.SKIPPED_QUESTION_INCIDES] = JSON.stringify(record[Metadata.SKIPPED_QUESTION_INCIDES])
  }
  if (record[Metadata.SURVEY_PREFERENCES]) {
    record[Metadata.SURVEY_PREFERENCES] = JSON.stringify(record[Metadata.SURVEY_PREFERENCES])
  }
  if (record[Outcome.FLAGS]) {
    record[Outcome.FLAGS] = JSON.stringify(record[Outcome.FLAGS])
  }

  // Omit fields that aren't in data dictionary
  return pick(
    record,
    dataDictionary.map((d: { field_name: string }) => d.field_name),
  )
}
