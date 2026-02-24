import axios from 'axios'
import dayjs from 'dayjs'
import { get, omit } from 'lodash'
import { v4 as uuidv4 } from 'uuid'

import { BadRequest } from '@feathersjs/errors'

import { Application } from '../../declarations'
import { achwmToRedcap, getRedcapCredentials, HEADERS, Metadata, redcapToAchwm } from '../redcap/redcapUtils'

type SurveyResponse = {
  [Metadata.PARTICIPANT_UUID]: string
  [Metadata.DATASET_ID]: string
}

export enum SurveyStatusEnum {
  IN_PROGRESS = 'In Progress',
  COMPLETE = 'Complete',
}

export class SurveyResponses {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async find(params: { query: { project_id: string; participant_uuid?: string; dataset_id?: string } }) {
    const { query } = params
    const { project_id, participant_uuid, dataset_id } = query
    const { url, token } = await getRedcapCredentials(project_id, this.app)

    if (participant_uuid) {
      // Return list of all survey responses for this participant
      return await this._findAllSurveyResponsesForParticipant(url, token, participant_uuid)
    }

    if (dataset_id) {
      // Return list of all survey resposnes for this dataset
      return await this._findAllSurveyResponsesInDataset(url, token, dataset_id)
    }

    throw new BadRequest('Either participant_uuid or dataset_id must be specified in query')
  }

  async _findAllSurveyResponsesForParticipant(url: string, token: string, participant_uuid: string) {
    const surveyResponses = (
      await axios.post(
        url,
        {
          token,
          content: 'record',
          action: 'export',
          format: 'json',
          returnFormat: 'json',
        },
        HEADERS,
      )
    ).data.filter((sr: SurveyResponse) => sr[Metadata.PARTICIPANT_UUID] === participant_uuid)

    return await redcapToAchwm(surveyResponses, url, token)
  }

  async _findAllSurveyResponsesInDataset(url: string, token: string, dataset_id: string) {
    const surveyResponses = (
      await axios.post(
        url,
        {
          token,
          content: 'record',
          action: 'export',
          format: 'json',
          returnFormat: 'json',
        },
        HEADERS,
      )
    ).data.filter((sr: SurveyResponse) => sr[Metadata.DATASET_ID] === dataset_id)

    return await redcapToAchwm(surveyResponses, url, token)
  }

  async get(record_id: string, params: { query: { project_id: string } }) {
    const project_id = get(params, 'query.project_id')
    const { url, token } = await getRedcapCredentials(project_id, this.app)

    if (!record_id) {
      throw new BadRequest('record_id must be provided')
    }

    const result = (
      await axios.post(
        url,
        {
          token,
          action: 'export',
          content: 'record',
          format: 'json',
          records: [record_id],
          returnFormat: 'json',
        },
        HEADERS,
      )
    ).data[0]

    return await redcapToAchwm(result, url, token)
  }

  async create(data: { project_id: string }) {
    let { project_id, ...surveyResponseData } = data
    const { url, token } = await getRedcapCredentials(project_id, this.app)

    // Add default values
    surveyResponseData = omit(
      {
        [Metadata.RECORD_ID]: uuidv4(),
        [Metadata.STATUS]: SurveyStatusEnum.IN_PROGRESS,
        [Metadata.PARTICIPANT_CONSENTED]: false,
        [Metadata.REVIEW_QUESTION_SHOWING]: false,
        [Metadata.CURRENT_QUESTION_INDEX]: 0,
        [Metadata.SKIPPED_QUESTION_INCIDES]: [],
        [Metadata.UPDATED_AT]: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        ...data,
      },
      ['project_id'],
    )

    // Process data to REDCap format
    const newSurveyResponse = await achwmToRedcap(surveyResponseData, url, token)

    // Create new record on REDCap server
    const newSurveyResponseId = (
      await axios.post(
        url,
        {
          token,
          content: 'record',
          action: 'import',
          format: 'json',
          overwriteBehavior: 'normal',
          forceAutoNumber: 'false',
          returnContent: 'ids',
          returnFormat: 'json',
          data: JSON.stringify([newSurveyResponse]),
        },
        HEADERS,
      )
    ).data[0]

    // Return record ID
    return newSurveyResponseId
  }

  async patch(record_id: string, data: any, params: { query: { project_id: string } }) {
    if (!record_id) {
      throw new BadRequest('record_id must be provided')
    }

    const projectId = get(params, 'query.project_id')
    const { url, token } = await getRedcapCredentials(projectId, this.app)

    // Transform data to redcap format
    const patchData = await achwmToRedcap(data, url, token)

    // Patch survey response
    await axios.post(
      url,
      {
        token,
        content: 'record',
        action: 'import',
        format: 'json',
        overwriteBehavior: 'normal',
        returnFormat: 'json',
        data: JSON.stringify([{ ...patchData, record_id }]),
      },
      HEADERS,
    )

    return { status: 200 }
  }

  async remove(record_id: string | null, params: { query: { project_id: string; dataset_id?: string } }) {
    const projectId = get(params, 'query.project_id')
    const { url, token } = await getRedcapCredentials(projectId, this.app)

    if (record_id) {
      return await this._removeOne(url, token, record_id)
    }

    const datasetId = get(params, 'query.dataset_id')
    if (datasetId) {
      return await this._removeAllSurveyResponsesInDataset(url, token, datasetId)
    }

    throw new BadRequest('Either record_id or params.query.dataset_id must be provided')
  }

  async _removeOne(url: string, token: string, record_id: string) {
    await axios.post(
      url,
      {
        token,
        action: 'delete',
        content: 'record',
        records: [record_id],
      },
      HEADERS,
    )

    return { status: 200 }
  }

  async _removeAllSurveyResponsesInDataset(url: string, token: string, dataset_id: string) {
    // Get record_ids of survey responses in this dataset
    const recordIds = (
      await axios.post(
        url,
        {
          token,
          content: 'record',
          action: 'export',
          format: 'json',
          fields: [Metadata.RECORD_ID, Metadata.DATASET_ID],
        },
        HEADERS,
      )
    ).data
      .filter((response: { [Metadata.DATASET_ID]: string }) => response[Metadata.DATASET_ID] === dataset_id)
      .map((response: { [Metadata.RECORD_ID]: string }) => response[Metadata.RECORD_ID])

    // Remove those survey responses
    await axios.post(
      url,
      {
        token,
        action: 'delete',
        content: 'record',
        records: recordIds,
      },
      HEADERS,
    )

    return { status: 200 }
  }
}
