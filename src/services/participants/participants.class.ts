import axios from 'axios'
import dayjs from 'dayjs'
import { get, omit, uniq } from 'lodash'
import { v4 as uuidv4 } from 'uuid'

import { BadRequest, NotFound } from '@feathersjs/errors'

import { Application } from '../../declarations'
import { achwmToRedcap, getRedcapCredentials, HEADERS, Metadata, redcapToAchwm } from '../redcap/redcapUtils'

const NO_RESPONSE_ERROR_MESSAGE =
  'The API request cannot complete because all the fields you have specified in your request are fields that will be removed due to your limited Data Export privileges, so there is nothing to return. Higher level data export rights are required to retrieve data for the fields specified.'

type RedcapParticipant = {
  [Metadata.PARTICIPANT_UUID]: string
  [Metadata.UPDATED_AT]: string
  [Metadata.PARTICIPANT_ID]: string
  [Metadata.BIRTH_MONTH]: string
  [Metadata.BIRTH_YEAR]: string
  [Metadata.PRONOUNS]: string
  [Metadata.SURVEY_PREFERENCES]: string
}

type MinimalParticipantRecord = {
  [Metadata.RECORD_ID]: string
  [Metadata.PARTICIPANT_UUID]: string
  [Metadata.UPDATED_AT]?: string
}

export class Participants {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async find(params: { query: { project_id: string; count?: boolean } }) {
    const { query } = params
    const { project_id, count } = query
    const { url, token } = await getRedcapCredentials(project_id, this.app)

    if (count) {
      return await this._count(url, token)
    }

    return await this._findAll(url, token)
  }

  // Return list of all participants for this project
  async _findAll(url: string, token: string) {
    const participantData = (
      await axios.post(
        url,
        {
          token,
          content: 'record',
          action: 'export',
          format: 'json',
          fields: [
            Metadata.PARTICIPANT_UUID,
            Metadata.UPDATED_AT,
            Metadata.PARTICIPANT_ID,
            Metadata.BIRTH_MONTH,
            Metadata.BIRTH_YEAR,
            Metadata.PRONOUNS,
            Metadata.SURVEY_PREFERENCES,
            Metadata.DATASET_ID,
          ],
        },
        HEADERS,
      )
    ).data as (RedcapParticipant & { [Metadata.DATASET_ID]: string })[]

    // Get list of participant IDs
    const participantUuids = uniq(participantData.map((p) => p[Metadata.PARTICIPANT_UUID]))

    // Process most recent data for each participant and add number of surveys and datasets
    const participants = await Promise.all(
      participantUuids.map(async (participantUuid) => {
        const records = participantData.filter((p) => p[Metadata.PARTICIPANT_UUID] === participantUuid)
        const mostRecentRecord = records.sort((a, b) => dayjs(b[Metadata.UPDATED_AT]).diff(a[Metadata.UPDATED_AT]))[0]

        const participant = await redcapToAchwm(mostRecentRecord, url, token)
        participant.number_of_surveys = records.length
        participant.number_of_datasets = uniq(records.map((r) => r[Metadata.DATASET_ID])).length

        return omit(participant, Metadata.DATASET_ID)
      }),
    )

    return participants
  }

  // Return count of number of participants in this project
  async _count(url: string, token: string) {
    try {
      const participantData = (
        await axios.post(
          url,
          {
            token,
            content: 'record',
            action: 'export',
            format: 'json',
            fields: [Metadata.PARTICIPANT_UUID],
          },
          HEADERS,
        )
      ).data as { [Metadata.PARTICIPANT_UUID]: string }[]

      // Count unique participant UUIDs
      const participantCount = uniq(participantData.map((p) => p[Metadata.PARTICIPANT_UUID])).length

      return participantCount.toString()
    } catch (error) {
      const errorMessage = get(error, 'response.data.error')
      // If there are no participants, the server throws an error
      if (errorMessage === NO_RESPONSE_ERROR_MESSAGE) {
        return '0'
      }
      throw error
    }
  }

  async get(participant_uuid: string, params: { query: { project_id: string } }) {
    const project_id = get(params, 'query.project_id')
    const { url, token } = await getRedcapCredentials(project_id, this.app)

    if (!participant_uuid) {
      throw new BadRequest('participant_uuid must be provided')
    }

    let participantRecords = (
      await axios.post(
        url,
        {
          token,
          content: 'record',
          action: 'export',
          format: 'json',
          fields: [
            Metadata.PARTICIPANT_UUID,
            Metadata.UPDATED_AT,
            Metadata.PARTICIPANT_ID,
            Metadata.BIRTH_MONTH,
            Metadata.BIRTH_YEAR,
            Metadata.PRONOUNS,
          ],
        },
        HEADERS,
      )
    ).data.filter((r: RedcapParticipant) => r[Metadata.PARTICIPANT_UUID] === participant_uuid)

    // Transform REDCap data into ACHWM data
    const mostRecentRecord = participantRecords.sort((a: RedcapParticipant, b: RedcapParticipant) =>
      dayjs(b[Metadata.UPDATED_AT]).diff(a[Metadata.UPDATED_AT]),
    )[0]
    const participant = await redcapToAchwm(mostRecentRecord, url, token)

    return participant
  }

  // Creates participant
  // Should only be called by test-data script
  async create(data: { project_id: string }) {
    const { project_id, ...rest } = data
    const { url, token } = await getRedcapCredentials(project_id, this.app)

    // Process data to REDCap format
    const newParticipant = await achwmToRedcap(
      {
        [Metadata.RECORD_ID]: uuidv4(),
        [Metadata.PARTICIPANT_UUID]: uuidv4(),
        ...rest,
      },
      url,
      token,
    )

    // Create new survey response including participant
    await axios.post(
      url,
      {
        token,
        content: 'record',
        action: 'import',
        format: 'json',
        overwriteBehavior: 'normal',
        forceAutoNumber: 'true',
        data: JSON.stringify([newParticipant]),
      },
      HEADERS,
    )

    return { status: 200 }
  }

  async patch(participant_uuid: string, data: any, params: { query: { project_id: string } }) {
    if (!participant_uuid) {
      throw new BadRequest('Participant UUID must be provided')
    }

    const projectId = get(params, 'query.project_id')
    const { url, token } = await getRedcapCredentials(projectId, this.app)

    // Find records with this participant
    const allRecords = (
      await axios.post(
        url,
        {
          token,
          content: 'record',
          action: 'export',
          format: 'json',
          fields: `${Metadata.RECORD_ID}, ${Metadata.PARTICIPANT_UUID}, ${Metadata.UPDATED_AT}`,
        },
        HEADERS,
      )
    ).data as MinimalParticipantRecord[]

    const participantRecords = allRecords.filter(
      (record: { [Metadata.PARTICIPANT_UUID]: string }) => record[Metadata.PARTICIPANT_UUID] === participant_uuid,
    )

    if (!participantRecords.length) {
      throw new NotFound(`No record found for id '${participant_uuid}'`)
    }

    const latestRecord = participantRecords.sort((a: Partial<RedcapParticipant>, b: Partial<RedcapParticipant>) =>
      dayjs(b[Metadata.UPDATED_AT]).diff(a[Metadata.UPDATED_AT]),
    )[0]

    // Transform data to redcap format
    const patchedParticipant = await achwmToRedcap({ ...latestRecord, ...data }, url, token)

    // Patch records with updated data
    await Promise.all(
      participantRecords.map((record) =>
        axios.post(
          url,
          {
            token,
            content: 'record',
            action: 'import',
            format: 'json',
            overwriteBehavior: 'normal',
            returnFormat: 'json',
            data: JSON.stringify([
              {
                ...patchedParticipant,
                [Metadata.UPDATED_AT]: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                [Metadata.RECORD_ID]: record[Metadata.RECORD_ID],
              },
            ]),
          },
          HEADERS,
        ),
      ),
    )

    return { status: 200 }
  }

  async remove(participant_uuid: string, params: { query: { project_id: string } }) {
    const project_id = get(params, 'query.project_id')
    const { url, token } = await getRedcapCredentials(project_id, this.app)

    // Get records for this participant
    const records = (
      await axios.post(
        url,
        {
          token,
          content: 'record',
          action: 'export',
          format: 'json',
          fields: `${Metadata.RECORD_ID}, ${Metadata.PARTICIPANT_UUID}`,
        },
        HEADERS,
      )
    ).data.filter((p: MinimalParticipantRecord) => p[Metadata.PARTICIPANT_UUID] === participant_uuid)

    // Delete records
    await axios.post(
      url,
      {
        token,
        action: 'delete',
        content: 'record',
        records: records.map((r: MinimalParticipantRecord) => r[Metadata.RECORD_ID]),
      },
      HEADERS,
    )

    return { status: 200 }
  }
}
