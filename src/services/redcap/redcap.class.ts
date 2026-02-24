import axios from 'axios'
import { get, uniq } from 'lodash'

import { Application } from '@feathersjs/express'
import { BadRequest } from '@feathersjs/errors'

import { getRedcapCredentials, HEADERS, Metadata } from './redcapUtils'

export enum RedcapActionEnum {
  CHECK_SERVER_CONNECTION = 'checkServerConnection',
  CHECK_PROJECT_CONNECTION = 'checkProjectConnection',
  CREATE_PROJECT = 'createProject',
  GET_DATASET_INFO = 'getDatasetInfo',
}

export class Redcap {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async create(data: { action: RedcapActionEnum; params: any }) {
    const { action, params } = data

    switch (action) {
      case RedcapActionEnum.CHECK_SERVER_CONNECTION:
        return await this._checkServerConnection(params)
      case RedcapActionEnum.CHECK_PROJECT_CONNECTION:
        return await this._checkProjectConnection(params)
      case RedcapActionEnum.CREATE_PROJECT:
        return await this._createProject(params)
      case RedcapActionEnum.GET_DATASET_INFO:
        return await this._getDatasetInfo(params)
    }
  }

  // Check if supertoken is correct for this server URL by trying to create a project with invalid data.
  // If the supertoken is incorrect, the error should be 403 instead of 400
  async _checkServerConnection(params: { server_url: string; supertoken: string }) {
    const { server_url, supertoken } = params

    if (!server_url || !supertoken) {
      return { result: false }
    }

    try {
      await axios.post(
        server_url,
        {
          token: supertoken,
          content: 'project',
          data: JSON.stringify([]),
          returnFormat: 'json',
        },
        HEADERS,
      )
    } catch (error) {
      const errorStatus = get(error, 'status')
      const errorMessage = get(error, 'response.data.error')

      if (errorStatus === 400 && errorMessage === 'The data is not in the specified format.') {
        return { result: true }
      } else {
        return { result: false }
      }
    }
  }

  // Check if token is correct for this project by trying to get the REDCap version
  async _checkProjectConnection(params: { server_url: string; token: string }) {
    const { server_url, token } = params

    if (!server_url || !token) {
      return { result: false }
    }

    try {
      await axios.post(
        server_url,
        {
          token,
          content: 'version',
        },
        HEADERS,
      )

      return { result: true }
    } catch {
      return { result: false }
    }
  }

  async _createProject(data: { name: string; community_id: string; redcap_template_id: string }) {
    const { name, community_id, redcap_template_id } = data

    if (!name) {
      throw new BadRequest('Project name must be provided')
    }

    if (!redcap_template_id) {
      throw new BadRequest('redcap_template_id must be provided')
    }

    // Get REDCap server URL and supertoken
    const community = await this.app.service('communities').get(community_id)
    const redcapServer = await this.app.service('redcap-servers').get(community.redcap_server_id)
    const { server_url, supertoken } = redcapServer

    // Copy template project
    const template = await this.app.service('redcap-templates').get(redcap_template_id)
    const { redcap_server_id, token } = template

    if (redcap_server_id !== community.redcap_server_id) {
      throw new BadRequest('The REDCap template project is not on the specified REDCap server')
    }

    const templateProject = (
      await axios.post(
        server_url,
        {
          token,
          content: 'metadata',
          format: 'json',
          returnFormat: 'json',
        },
        HEADERS,
      )
    ).data

    // Create project in REDCap
    const newProjectToken = (
      await axios.post(
        server_url,
        {
          token: supertoken,
          content: 'project',
          format: 'json',
          data: JSON.stringify([{ project_title: name, purpose: 4 }]),
          /*
          Purpose codes:
            0: Practice / Just for fun
            1: Other (Must also provide 'purpose_other')
            2: Research
            3: Quality Improvement
            4: Operational Support
        */
        },
        HEADERS,
      )
    ).data

    // Upload template project
    await axios.post(
      server_url,
      {
        token: newProjectToken,
        content: 'metadata',
        format: 'json',
        returnFormat: 'json',
        data: JSON.stringify(templateProject),
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    // Grant this project token the right to delete records
    const username = (
      await axios.post(
        server_url,
        {
          token: newProjectToken,
          content: 'user',
          format: 'json',
          returnFormat: 'json',
        },
        HEADERS,
      )
    ).data[0].username

    await axios.post(
      server_url,
      {
        token: newProjectToken,
        content: 'user',
        format: 'json',
        data: JSON.stringify([{ username, record_delete: 1 }]),
      },
      HEADERS,
    )

    // Return new project access token
    return newProjectToken
  }

  async _getDatasetInfo(params: { project_id: string; dataset_id: string }) {
    const { project_id, dataset_id } = params
    const { url, token } = await getRedcapCredentials(project_id, this.app)

    if (!dataset_id) {
      throw new BadRequest('dataset_id must be provided')
    }

    const datasetRecords = (
      await axios.post(
        url,
        {
          token,
          content: 'record',
          action: 'export',
          format: 'json',
          fields: [Metadata.DATASET_ID, Metadata.PARTICIPANT_UUID],
        },
        HEADERS,
      )
    ).data.filter((r: any) => r[Metadata.DATASET_ID] === dataset_id)

    const numberOfParticipants = uniq(datasetRecords.map((r: any) => r[Metadata.PARTICIPANT_UUID])).length

    return {
      numberOfSurveyResponses: datasetRecords.length,
      numberOfParticipants,
    }
  }
}
